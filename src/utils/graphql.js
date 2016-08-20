/* @flow */
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLScalarType
} from "graphql";
import type { GraphQLSchema } from "graphql";
import type {
  FlowTypes,
  FlowType
} from "./types";
import { convertFlowObjectTypeAnnotation } from "./flow";

export function checkPropsObjectTypeMatchesSchema(
  schema: GraphQLSchema,
  fragmentName: string,
  objectType: ObjectTypeProperty
) {
  const graphqlType = schema.getType(fragmentName);
  if (!graphqlType || !(graphqlType instanceof GraphQLObjectType)) {
    throw new Error(`There is no GraphQL object type named '${fragmentName}'`);
  }

  const typeAnnotation = objectType.value;
  const flowTypes = typeAnnotation.type === "ObjectTypeAnnotation" ? convertFlowObjectTypeAnnotation(typeAnnotation) : {};
  const graphqlTypes = convertGraphqlObjectType(graphqlType);

  const result = compareFlowTypes(flowTypes, graphqlTypes);
  if (result.length > 0) {
    const errors = result.map(r => `Expected type '${r.expected}', actual type '${r.actual}' for path ${r.path.join(".")}`);
    throw new Error(`Errors for fragment ${fragmentName}:\n${errors.join("\n")}`);
  }
}

function convertGraphqlObjectType(objectType: GraphQLObjectType): FlowTypes {
  const fields = objectType.getFields();
  return Object.keys(fields).reduce((obj, key) => {
    const field = fields[key];
    return { ...obj, [key]: graphqlFieldToString(field) };
  }, {});
}

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
  const createPath = key => {
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

export function toGraphQLQueryString(
  fragmentName: string,
  fragmentDirectives: Object,
  objectType: ObjectTypeProperty,
  relayContainerFragments: { [name: string]: Array<string> }
): string {
  const fragmentKey = objectType.key.name;
  const typeAnnotation = objectType.value;
  const obj = typeAnnotation.type === "ObjectTypeAnnotation" ? convertFlowObjectTypeAnnotation(typeAnnotation) : {};

  const graphQlQueryBody = objectToGraphQLString(obj);

  const childRelayContainersForFragment = Object.keys(relayContainerFragments).reduce((c, name) => {
    const fragmentKeys = relayContainerFragments[name];
    if (fragmentKeys.indexOf(fragmentKey) >= 0) {
      c.push(name);
    }
    return c;
  }, []);

  let directives = directivesToGraphQLString(fragmentDirectives);
  directives = directives ? `${directives} ` : "";
  let graphQlQuery = `\nfragment on ${fragmentName} ${directives}{\n${graphQlQueryBody}`;
  const graphQlQueryEnd = "\n}\n";

  if (childRelayContainersForFragment.length > 0) {
    if (graphQlQueryBody) {
      graphQlQuery = `${graphQlQuery},\n  `;
    }

    graphQlQuery += childRelayContainersForFragment
      .map(name => `\${${name}.getFragment('${fragmentKey}')}`)
      .join(",\n  ");
  }
  graphQlQuery += graphQlQueryEnd;

  return `() => Relay.QL\`${graphQlQuery}\``;
}

function objectToGraphQLString(obj: { [key: string]: FlowType }, level: number = 1): string {
  const indentation = "  ".repeat(level);

  const strings = Object.keys(obj).reduce((parts, key) => {
    const value = obj[key];
    let str = key;
    if (value.type === "object") {
      str = `${str} {\n${objectToGraphQLString(value.properties, level + 1)}\n${indentation}}`;
    }
    parts.push(indentation + str);
    return parts;
  }, []);

  return strings.join(",\n");
}

function directivesToGraphQLString(directives: Object): string {
  const directiveNames = Object.keys(directives);
  directiveNames.sort();
  return directiveNames.map(directiveName => {
    const directiveArgsMap = directives[directiveName];
    const directiveArgs = Object.keys(directiveArgsMap);
    directiveArgs.sort();

    const directiveArgsStr = directiveArgs.map(directiveArg => {
      const directiveArgValue = directiveArgsMap[directiveArg];
      return `${directiveArg}: ${JSON.stringify(directiveArgValue)}`;
    }).join(", ");

    return `@${directiveName}(${directiveArgsStr})`;
  }).join(" ");
}
