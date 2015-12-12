/* @flow */
import isObject from "lodash.isobject";
import { convertFlowObjectTypeAnnotation } from "./flow";

function objectToGraphQLString(obj: Object, level: number = 1): string {
  const indentation = "  ".repeat(level);

  const strings = Object.keys(obj).reduce((parts, key) => {
    const value = obj[key];
    let str = key;
    if (isObject(value)) {
      str = str + " {\n" + objectToGraphQLString(value, level + 1) + "\n" + indentation + "}";
    }
    parts.push(indentation + str);
    return parts;
  }, []);

  return strings.join(",\n");
}

const uppercaseFirstChar = str => str.charAt(0).toUpperCase() + str.slice(1);

export function toGraphQLQueryString(
  objectType: ObjectTypeProperty,
  relayContainerFragments: { [name: string]: Array<string> },
  fragmentName?: ?string
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

  let graphQlQuery = "\n" +
    "fragment on " + (fragmentName || uppercaseFirstChar(fragmentKey)) + " {\n" +
    graphQlQueryBody;
  const graphQlQueryEnd = "\n}\n";

  if (childRelayContainersForFragment.length > 0) {
    if (graphQlQueryBody) {
      graphQlQuery = graphQlQuery + ",\n  ";
    }

    graphQlQuery = graphQlQuery + childRelayContainersForFragment
      .map(name => "${" + name + ".getFragment('" + fragmentKey + "')}")
      .join(",\n  ");
  }
  graphQlQuery = graphQlQuery + graphQlQueryEnd;

// const buildRequire = template(`
//   var IMPORT_NAME = require(SOURCE);
// `);

  return "() => Relay.QL`" + graphQlQuery + "`";
}
