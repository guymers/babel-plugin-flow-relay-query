/* @flow */
/* eslint no-param-reassign:0 */
export type FragmentOptions = {
  name?: string,
  directives?: {
    [name: string]: { [arg: string]: boolean|number|string }
  }
}

function objectExpressionProperties(node: ObjectExpression): { [key: string]: Expression } {
  return node.properties.reduce((opts, property) => {
    if (property.key.type === "Identifier") {
      opts[property.key.name] = property.value;
    }
    return opts;
  }, {});
}

export function calculateFragmentOptions(genFragmentMarkerFunction: CallExpression): FragmentOptions {
  const options = {};

  const optionObj = genFragmentMarkerFunction.arguments[0];
  if (optionObj && optionObj.type === "ObjectExpression") {
    const fragmentOptions = objectExpressionProperties(optionObj);

    const nameNode = fragmentOptions.name;
    if (nameNode && nameNode.type === "StringLiteral") {
      options.name = nameNode.value;
    }

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

