/* @flow */
/* eslint no-param-reassign:0 */
import type { FragmentOptions } from "../FragmentOptions";

function objectExpressionProperties(node: ObjectExpression): { [key: string]: Expression } {
  return node.properties.reduce((opts, property) => {
    if (property.key.type === "Identifier") {
      opts[property.key.name] = property.value;
    }
    return opts;
  }, {});
}

function findStringLiteral(name: string, items: { [key: string]: Expression }): ?string {
  const node = items[name];
  if (node && node.type === "StringLiteral") {
    return node.value;
  }
  return null;
}

export function calculateFragmentOptions(callExpression: CallExpression, argumentIndex: number = 0): FragmentOptions {
  const options = {};

  const optionObj = callExpression.arguments[argumentIndex];
  if (optionObj && optionObj.type === "ObjectExpression") {
    const fragmentOptions = objectExpressionProperties(optionObj);

    ["name", "type", "templateTag"].forEach((key) => {
      const value = findStringLiteral(key, fragmentOptions);
      if (value) {
        options[key] = value;
      }
    });

    const directivesNode = fragmentOptions.directives;
    if (directivesNode && directivesNode.type === "ObjectExpression") {
      const rawDirectiveOptions = objectExpressionProperties(directivesNode);
      options.directives = Object.keys(rawDirectiveOptions).reduce((opts, directiveName) => {
        const directiveArgsNode = rawDirectiveOptions[directiveName];
        if (directiveArgsNode.type === "ObjectExpression") {
          // find any arguments that go with the directive
          opts[directiveName] = directiveArgsNode.properties.reduce((args, property) => {
            if (property.key.type === "Identifier") {
              const argName = property.key.name;
              switch (property.value.type) {
                case "BooleanLiteral":
                case "NumericLiteral":
                case "StringLiteral":
                  args[argName] = property.value.value;
                  break;
                default:
                  // nothing
              }
            }
            return args;
          }, {});
        }
        return opts;
      }, {});
    }
  }

  return options;
}

