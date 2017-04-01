/* @flow */
import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType
} from "graphql";
import type { GraphQLOutputType, GraphQLSchema } from "graphql";
import type {
  FlowTypes,
  FlowType
} from "./types";
import type { ChildFragmentTransformations } from "../ChildFragmentTransformations";
import { convertTypeAnnotationToFlowType } from "./flow";

export function checkPropsObjectTypeMatchesSchema(
  schema: GraphQLSchema,
  fragmentType: string,
  objectType: ObjectTypeProperty,
  flowTypes: { [name: string ]: ObjectTypeAnnotation }
) {
  const graphqlType = schema.getType(fragmentType);
  if (!graphqlType || !(graphqlType instanceof GraphQLObjectType)) {
    throw new Error(`There is no GraphQL object type named '${fragmentType}'`);
  }

  const flowType = convertTypeAnnotationToFlowType(objectType.value, objectType.optional, flowTypes);
  const graphqlTypes = convertGraphqlTypeToFlowType(graphqlType, false);

  const result = compareFlowTypes(flowType, graphqlTypes);
  if (result.length > 0) {
    const errors = result.map(r => `Expected type '${r.expected}', actual type '${r.actual}' for path ${r.path.join(".")}`);
    throw new Error(`Errors for fragment ${fragmentType}:\n${errors.join("\n")}`);
  }
}

function convertGraphqlObjectType(objectType: GraphQLObjectType, objectTypeCache: Object): FlowTypes {
  const objectTypeString = objectType.toString();
  if (!objectTypeCache[objectTypeString]) {
    const fields = objectType.getFields();
    // placeholder while we have possible recursive structures
    objectTypeCache[objectTypeString] = true; // eslint-disable-line no-param-reassign
    objectTypeCache[objectTypeString] = Object.keys(fields).reduce((obj, key) => { // eslint-disable-line no-param-reassign
      const field = fields[key];
      return {
        ...obj,
        [key]: convertGraphqlTypeToFlowType(field.type, true, objectTypeCache)
      };
    }, {});
  }

  return objectTypeCache[objectTypeString];
}

function convertGraphqlTypeToFlowType(
  graphqlType: GraphQLOutputType,
  nullable: boolean,
  objectTypeCache: Object = {}
): FlowType {
  if (graphqlType instanceof GraphQLNonNull) {
    return convertGraphqlTypeToFlowType(graphqlType.ofType, false, objectTypeCache);
  }

  if (graphqlType instanceof GraphQLObjectType) {
    return {
      type: "object",
      nullable,
      properties: convertGraphqlObjectType(graphqlType, objectTypeCache)
    };
  }

  if (graphqlType instanceof GraphQLList) {
    return {
      type: "array",
      child: convertGraphqlTypeToFlowType(graphqlType.ofType, true, objectTypeCache)
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

const typeToString: (type: FlowType) => string = type => (type.nullable ? "?" : "") + type.type;

function compareFlowTypes(a: FlowType, b: FlowType, path: Array<string> = []): Array<CompareFlowTypesResult> {
  const actual = typeToString(a);
  const expected = typeToString(b);

  if (actual !== expected) {
    return [{ path, actual, expected }];
  }

  // help flow, cant handle an &&
  let aProps = null;
  if (a.type === "object") {
    aProps = a.properties;
  }

  let bProps = null;
  if (b.type === "object") {
    bProps = b.properties;
  }

  if (aProps && bProps) {
    const createPath = (key) => {
      const pathCopy = path.slice();
      pathCopy.push(key);
      return pathCopy;
    };

    const aKeys = Object.keys(aProps).sort();
    return aKeys.reduce((result, key) => {
      // babel relay plugin handles missing fields
      const bType = bProps && bProps[key];
      if (bType) {
        const aType = aProps && aProps[key];
        if (aType) {
          return result.concat(compareFlowTypes(aType, bType, createPath(key)));
        }
      }
      return result;
    }, []);
  }

  if (a.type === "array" && b.type === "array") {
    return compareFlowTypes(a.child, b.child, path);
  }

  return [];
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
  const flowType = convertTypeAnnotationToFlowType(objectType.value, objectType.optional, flowTypes);

  // remove the first and last lines if flowType is an object as opening braces are added later
  let graphQlQueryBody = flowTypeToGraphQLString(flowType).trim();

  if (graphQlQueryBody) {
    if (graphQlQueryBody[0] === "{") {
      graphQlQueryBody = graphQlQueryBody.substr(graphQlQueryBody.indexOf("\n") + 1);
    }

    if (graphQlQueryBody[graphQlQueryBody.length - 1] === "}") {
      graphQlQueryBody = graphQlQueryBody.substr(0, graphQlQueryBody.lastIndexOf("\n"));
    }
  }

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

function flowTypeToGraphQLString(flowType: FlowType, level: number = 1): string {
  const fieldName = flowType.fieldName ? `: ${flowType.fieldName}` : "";

  if (flowType.type === "object") {
    const indentation = "  ".repeat(level);

    const props = flowType.properties;
    const strings = Object.keys(props).reduce((parts, key) => {
      const value = props[key];
      parts.push(`${indentation}${key}${flowTypeToGraphQLString(value, level + 1)}`);
      return parts;
    }, []);

    return `${fieldName} {\n${strings.join("\n")}\n${"  ".repeat(level - 1)}}`;
  } else if (flowType.type === "array") {
    return flowTypeToGraphQLString(flowType.child, level);
  }

  return fieldName;
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
