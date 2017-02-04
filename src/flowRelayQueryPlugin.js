/* @flow */
/* eslint no-param-reassign:0 */
import type { NodePath } from "babel-traverse";
import type { GraphQLSchema } from "graphql";
import type { ChildFragmentTransformations } from "./ChildFragmentTransformations";

import { relay as childFragmentTransformationsRelay } from "./ChildFragmentTransformations";
import { isTypeImport, parseImport } from "./utils/import";
import { parseReactComponentClass } from "./utils/react";
import { parseFile } from "./utils/parse";
import { calculateFragmentOptions } from "./utils/fragmentOptions";
import { checkPropsObjectTypeMatchesSchema, toGraphQLQueryString } from "./utils/graphql";

const uppercaseFirstChar = str => str.charAt(0).toUpperCase() + str.slice(1);

type PluginOptions = {
  genFragFromPropsName?: string;
  genFragFromPropsNameFor?: string;
  defaultTemplateTag?: string;
  defaultFragmentName?: (componentName: string, fragmentKey: string) => ?string;
  childFragmentTransformations?: ChildFragmentTransformations;
}

type PluginInput = {
  types: Object;
};
type PluginDef = {
  visitor: Object;
}

export default function (schema: GraphQLSchema, options: PluginOptions = {}): (plugin: PluginInput) => PluginDef {
  const genFragFromPropsName = options.genFragFromPropsName || "generateFragmentFromProps";
  const genFragFromPropsNameFor = options.genFragFromPropsNameFor || "generateFragmentFromPropsFor";
  const defaultTemplateTag = options.defaultTemplateTag || "() => Relay.QL";
  const defaultFragmentName = options.defaultFragmentName || function noop() { return null; };
  const childFragmentTransformations = options.childFragmentTransformations || childFragmentTransformationsRelay;

  return function flowRelayQueryPlugin(plugin: PluginInput): PluginDef {
    const t = plugin.types;

    type ActiveVisitorState = {
      imports: { [name: string]: string };
      flowTypes: { [name: string]: ObjectTypeAnnotation };
      componentPropTypes: { [name: string]: string };
      componentContainerFragments: { [name: string]: Array<string> };
    };
    const activeVisitor = {
      TypeAlias({ node }: NodePath, state: ActiveVisitorState) { // eslint-disable-line no-shadow
        if (node.type !== "TypeAlias") {
          return;
        }

        if (node.right.type === "ObjectTypeAnnotation") {
          state.flowTypes[node.id.name] = node.right;
        }
      },

      JSXElement({ node }: NodePath, state: ActiveVisitorState) { // eslint-disable-line no-shadow
        if (node.type !== "JSXElement") {
          return;
        }

        const name = node.openingElement.name.name;
        const filename = state.imports[name];
        if (filename) {
          const visitor = {
            CallExpression(p: NodePath) {
              const n = p.node;

              let reactComponentName;
              let fragmentObject;

              if (state.imports[genFragFromPropsNameFor]) {
                if (n.type === "CallExpression" && n.callee.type === "Identifier" && n.callee.name === genFragFromPropsNameFor) {
                  const arg1 = n.arguments[0];
                  if (arg1.type === "Identifier") {
                    reactComponentName = arg1.name;

                    const possibleFragmentObject = p.findParent(_ => t.isObjectExpression(_));
                    if (possibleFragmentObject && possibleFragmentObject.node.type === "ObjectExpression") {
                      fragmentObject = possibleFragmentObject.node;
                    }
                  }
                }
              }

              if (n.type === "CallExpression" && n.arguments.length === 2) {
                const [arg1, arg2] = n.arguments;
                if (arg1.type !== "Identifier" || arg2.type !== "ObjectExpression") {
                  return;
                }

                reactComponentName = arg1.name;
                const fragment = arg2.properties.find(_ => _.key.type === "Identifier" && _.key.name === "fragments");
                if (fragment && fragment.value.type === "ObjectExpression") {
                  fragmentObject = fragment.value;
                }
              }

              if (reactComponentName && fragmentObject) {
                const fragmentNames = fragmentObject.properties.reduce((fragNames, property) => {
                  if (property.key.type === "Identifier") {
                    fragNames.push(property.key.name);
                  }
                  return fragNames;
                }, []);
                state.componentContainerFragments[reactComponentName] = fragmentNames;
              }
            }
          };
          parseFile(filename, visitor, state);
        }
      },

      ClassDeclaration({ node }: NodePath, state: ActiveVisitorState) { // eslint-disable-line no-shadow
        if (node.type !== "ClassDeclaration") {
          return;
        }

        const { className, propType } = parseReactComponentClass(node) || {};
        if (className && propType) {
          state.componentPropTypes[className] = propType;
        }
      },

      ArrowFunctionExpression({ node, parent }: NodePath, state: ActiveVisitorState) { // eslint-disable-line no-shadow
        if (node.type !== "ArrowFunctionExpression") {
          return;
        }

        const functionName = parent && parent.id && parent.id.name;

        if (functionName && node.params.length === 1) {
          let typeAnnotation = node.params[0].typeAnnotation;
          typeAnnotation = typeAnnotation && typeAnnotation.typeAnnotation;

          if (typeAnnotation && typeAnnotation.type === "GenericTypeAnnotation") {
            state.componentPropTypes[functionName] = typeAnnotation.id.name;
          }
        }
      },

      // is this the fragment generate marker function
      CallExpression(path: NodePath, state: ActiveVisitorState) {
        const { node, parent } = path;
        if (node.type !== "CallExpression") {
          return;
        }

        let argumentIndex = 0;
        const reactComponentNames = [];
        if (node.callee.name === genFragFromPropsName) {
          const relayCreateContainer = path.findParent(p => t.isCallExpression(p));
          if (!relayCreateContainer || relayCreateContainer.node.type !== "CallExpression") {
            return;
          }

          const argPaths = relayCreateContainer.get("arguments");
          const arg1Path = Array.isArray(argPaths) && argPaths[0];
          if (!arg1Path) {
            throw new Error("Could not find first argument for Relay.createContainer");
          }

          if (arg1Path.node.type === "Identifier") {
            reactComponentNames.push(arg1Path.node.name);
          } else {
            arg1Path.traverse({
              Identifier(identifierPath: NodePath) {
                if (identifierPath.node.type === "Identifier") {
                  reactComponentNames.push(identifierPath.node.name);
                }
              }
            });
          }
        } else if (node.callee.name === genFragFromPropsNameFor) {
          argumentIndex = 1;

          const componentArg = node.arguments[0];
          if (componentArg && componentArg.type === "Identifier") {
            const reactComponentName = componentArg.name;
            reactComponentNames.push(reactComponentName);
          }
        } else {
          return;
        }

        const typeName = reactComponentNames.reduce(
          (result, reactComponentName) => result || state.componentPropTypes[reactComponentName],
          null
        );
        if (!typeName) {
          const reactComponentNamesStr = reactComponentNames.join(", ");
          throw new Error(`Could not find flow prop types for possible react components [${reactComponentNamesStr}]`);
        }
        const reactComponentName = reactComponentNames[0];

        const type = state.flowTypes[typeName];
        if (!type) {
          throw new Error(`There is no flow type object with name ${typeName}`);
        }

        const fragmentKey = parent && t.isProperty(parent) && parent.key.name;
        const typeAtKey = type.properties.find(_ => _.key.name === fragmentKey);
        if (!typeAtKey) {
          throw new Error(`There is no property named '${fragmentKey}' in flow type ${typeName}`);
        }

        const generateFragmentOptions = calculateFragmentOptions(node, argumentIndex);
        const fragmentType = generateFragmentOptions.type || uppercaseFirstChar(typeAtKey.key.name);
        const fragmentName = generateFragmentOptions.name || defaultFragmentName(reactComponentName, fragmentType);
        const fragmentDirectives = generateFragmentOptions.directives || {};

        checkPropsObjectTypeMatchesSchema(schema, fragmentType, typeAtKey);
        const graphQlQuery = toGraphQLQueryString(
          fragmentName,
          fragmentType,
          fragmentDirectives,
          typeAtKey,
          state.componentContainerFragments,
          childFragmentTransformations
        );

        const templateTag = generateFragmentOptions.templateTag || defaultTemplateTag;
        const taggedTemplateGraphQLQuery = `${templateTag}\`${graphQlQuery}\``;

        // relay needs a start location on the Relay.QL template string
        const start = node.loc.start;
        path.replaceWithSourceString(taggedTemplateGraphQLQuery);
        if (path.node.type === "ArrowFunctionExpression") {
          path.node.body.loc = { start };
        }
      }
    };

    type ImportVisitorState = {
      filename: string;
      imports: { [name: string]: string };
      flowTypes: { [name: string]: ObjectTypeAnnotation };
    };
    const importVisitor = {
      ImportDeclaration(path: NodePath, state: ImportVisitorState) {
        const node = path.node;
        if (node.type !== "ImportDeclaration") {
          return;
        }

        const { filename, variables } = parseImport(node, state.filename) || {};

        if (filename) {
          if (isTypeImport(node)) {
            const visitor = {
              TypeAlias({ node: n }: NodePath) { // eslint-disable-line no-shadow, no-unused-vars
                if (n.type !== "TypeAlias") {
                  return;
                }

                const typeName = n.id.name;
                if (variables.indexOf(typeName) >= 0 && n.right.type === "ObjectTypeAnnotation") {
                  state.flowTypes[typeName] = n.right;
                }
              }
            };
            parseFile(filename, visitor, {});
          } else {
            variables.forEach((variable) => {
              state.imports[variable] = filename;
            });
          }
        }

        // remove the marker function import
        if (node.specifiers.find(_ => _.local.name === genFragFromPropsName || _.local.name === genFragFromPropsNameFor)) {
          path.remove();
        }
      }
    };

    return {
      visitor: {
        Program(path: NodePath, state: PluginPass) {
          const imports = {};
          const flowTypes = {};
          const filename = state.file.opts.filename;
          path.traverse(importVisitor, { imports, flowTypes, filename });

          if (imports[genFragFromPropsName] || imports[genFragFromPropsNameFor]) {
            path.traverse(activeVisitor, {
              imports,
              flowTypes,
              componentPropTypes: {},
              componentContainerFragments: {}
            });
          }
        }
      }
    };
  };
}
