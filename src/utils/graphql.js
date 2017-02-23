/* @flow */
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLScalarType
} from "graphql";
import type { GraphQLSchema } from "graphql";
import type {
  FlowTypes,
  FlowType
} from "./types";
import type { ChildFragmentTransformations } from "../ChildFragmentTransformations";
import { convertFlowObjectTypeAnnotation } from "./flow";

export function checkPropsObjectTypeMatchesSchema(
  schema: GraphQLSchema,
  fragmentType: string,
  objectType: ObjectTypeProperty
) {
  const graphqlType = schema.getType(fragmentType);
  if (!graphqlType || !(graphqlType instanceof GraphQLObjectType)) {
    throw new Error(`There is no GraphQL object type named '${fragmentType}'`);
  }

  const typeAnnotation = objectType.value;
  const flowTypes = typeAnnotation.type === "ObjectTypeAnnotation" ? convertFlowObjectTypeAnnotation(typeAnnotation) : {};
  const graphqlTypes = convertGraphqlObjectType(graphqlType);

  const result = compareFlowTypes(flowTypes, graphqlTypes);
  if (result.length > 0) {
    const errors = result.map(r => `Expected type '${r.expected}', actual type '${r.actual}' for path ${r.path.join(".")}`);
    throw new Error(`Errors for fragment ${fragmentType}:\n${errors.join("\n")}`);
  }
}

function convertGraphqlObjectType(objectType: GraphQLObjectType): FlowTypes {
  const objectTypeString = objectType.toString();
  if (!convertGraphqlObjectType.cache[objectTypeString]) {
    const fields = objectType.getFields();
    // placeholder while we have possible recursive structures
    convertGraphqlObjectType.cache[objectTypeString] = true;
    convertGraphqlObjectType.cache[objectTypeString] = Object.keys(fields).reduce((obj, key) => {
      const field = fields[key];
      return { ...obj, [key]: graphqlFieldToString(field) };
    }, {});
  }

  return convertGraphqlObjectType.cache[objectTypeString];
}

convertGraphqlObjectType.cache = {};

function graphqlFieldToString(field: Object): FlowType {
  let nullable = true;
  let graphqlType = field.type;
  if (graphqlType instanceof GraphQLNonNull) {
    nullable = false;
    graphqlType = graphqlType.ofType;
  }

  if (graphqlType instanceof GraphQLObjectType) {
    return {
      type: "object",
      nullable,
      properties: convertGraphqlObjectType(graphqlType)
    };
  }

  if (graphqlType instanceof GraphQLList) {
    const children = graphqlFieldToString(graphqlType.ofType);

    return {
      type: "array",
      nullable,
      children: children.type === "object" ? convertGraphqlObjectType(graphqlType.ofType) : null
    };
  }

  const flowTypeName = graphqlType instanceof GraphQLScalarType ? graphqlType.name : "any";
  switch (flowTypeName) {
    case "Boolean":
      return { type: "boolean", nullable };
    case "Int":
    case "Float":
      return { type: "number", nullable };
    case "ID":
    case "String":
      return { type: "string", nullable };
    default:
      return { type: "any", nullable };
  }
}

type CompareFlowTypesResult = { path: Array<string>, expected: string, actual: string };

function compareFlowTypes(a: FlowTypes, b: FlowTypes, path: Array<string> = []): Array<CompareFlowTypesResult> {
  const createPath = (key) => {
    const pathCopy = path.slice();
    pathCopy.push(key);
    return pathCopy;
  };

  const typeToString: (type: FlowType) => string = type => (type.nullable ? "?" : "") + type.type;

  const aKeys = Object.keys(a).sort();
  return aKeys.reduce((result, key) => {
    // babel relay plugin handles missing fields
    if (b[key]) {
      const aType = a[key];
      const bType = b[key];

      const actual = typeToString(aType);
      const expected = typeToString(bType);

      if (actual !== expected) {
        result.push({ path: createPath(key), actual, expected });
      } else if (aType.type === "object" && bType.type === "object") {
        return result.concat(compareFlowTypes(aType.properties, bType.properties, createPath(key)));
      }
    }
    return result;
  }, []);
}

function getObjectFromAnnotation(
  typeAnnotation: Object,
  flowTypes: { [name: string]: ObjectTypeAnnotation }
): Object {
  switch (typeAnnotation.type) {
    case "ObjectTypeAnnotation":
      return convertFlowObjectTypeAnnotation(typeAnnotation, flowTypes);
    case "GenericTypeAnnotation":
      return typeAnnotation.id && flowTypes[typeAnnotation.id.name]
        ? convertFlowObjectTypeAnnotation(flowTypes[typeAnnotation.id.name], flowTypes)
        : {};
    default:
      return {};
  }
}

export function toGraphQLQueryString(
  fragmentName: ?string,
  fragmentType: string,
  fragmentDirectives: Object,
  objectType: ObjectTypeProperty,
  componentContainerFragments: { [name: string]: Array<string> },
  childFragmentTransformations: ChildFragmentTransformations,
  flowTypes: { [name: string]: ObjectTypeAnnotation }
): string {
  const fragmentKey = objectType.key.name;
  const typeAnnotation = objectType.value;
  const obj = getObjectFromAnnotation(typeAnnotation, flowTypes);

  const graphQlQueryBody = objectToGraphQLString(obj);

  const childContainersForFragment = Object.keys(componentContainerFragments).reduce((c, name) => {
    const fragmentKeys = componentContainerFragments[name];
    if (fragmentKeys.indexOf(fragmentKey) >= 0) {
      c.push(name);
    }
    return c;
  }, []);

  let directives = directivesToGraphQLString(fragmentDirectives);
  directives = directives ? `${directives} ` : "";
  const fragName = fragmentName ? ` ${fragmentName}` : "";
  let graphQlQuery = `\nfragment${fragName} on ${fragmentType} ${directives}{\n${graphQlQueryBody}`;
  const graphQlQueryEnd = "\n}\n";

  const insideChildFragmentStrings = childContainersForFragment
    .map(name => childFragmentTransformations.insideFragment(name, fragmentKey))
    .filter(fragStr => fragStr !== null);

  if (insideChildFragmentStrings.length > 0) {
    if (graphQlQueryBody) {
      graphQlQuery += "\n  ";
    }

    graphQlQuery += insideChildFragmentStrings.join("\n  ");
  }

  graphQlQuery += graphQlQueryEnd;

  const outsideChildFragmentStrings = childContainersForFragment
    .map(name => childFragmentTransformations.outsideFragment(name, fragmentKey))
    .filter(fragStr => fragStr !== null);

  if (outsideChildFragmentStrings.length > 0) {
    graphQlQuery += outsideChildFragmentStrings.join("\n");
    graphQlQuery += "\n";
  }

  return `${graphQlQuery}`;
}

function objectToGraphQLString(obj: { [key: string]: FlowType }, level: number = 1): string {
  const indentation = "  ".repeat(level);

  const strings = Object.keys(obj).reduce((parts, key) => {
    const value = obj[key];
    let str = key;
    if (value.type === "object") {
      str = `${str} {\n${objectToGraphQLString(value.properties, level + 1)}\n${indentation}}`;
    }
    if (value.type === "array" && value.children) {
      str = `${str} {\n${objectToGraphQLString(value.children, level + 1)}\n${indentation}}`;
    }
    parts.push(indentation + str);
    return parts;
  }, []);

  return strings.join("\n");
}

function directivesToGraphQLString(directives: Object): string {
  const directiveNames = Object.keys(directives);
  directiveNames.sort();
  return directiveNames.map((directiveName) => {
    const directiveArgsMap = directives[directiveName];
    const directiveArgs = Object.keys(directiveArgsMap);
    directiveArgs.sort();

    const directiveArgsStr = directiveArgs.map((directiveArg) => {
      const directiveArgValue = directiveArgsMap[directiveArg];
      return `${directiveArg}: ${JSON.stringify(directiveArgValue)}`;
    }).join(", ");

    return `@${directiveName}(${directiveArgsStr})`;
  }).join(" ");
}
