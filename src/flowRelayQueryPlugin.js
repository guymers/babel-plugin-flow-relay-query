/* @flow */
/* eslint no-param-reassign:0 */
import type { NodePath } from "babel-traverse";

import { isTypeImport, parseImport } from "./utils/import";
import { isRelayCreateContainer, parseReactComponentClass } from "./utils/react";
import { parseFile } from "./utils/parse";
import { checkPropsObjectTypeMatchesSchema, toGraphQLQueryString } from "./utils/graphql";
import type { GraphQLSchema } from "graphql";

const GEN_FRAG_FROM_PROPS_NAME = "generateFragmentFromProps";

const uppercaseFirstChar = str => str.charAt(0).toUpperCase() + str.slice(1);

type PluginInput = {
  types: Object;
};
type PluginDef = {
  visitor: Object;
}

export default function (schema: GraphQLSchema): (plugin: PluginInput) => PluginDef {
  return function flowRelayQueryPlugin(plugin: PluginInput): PluginDef {
    const t = plugin.types;

    type ActiveVisitorState = {
      imports: { [name: string]: string };
      flowTypes: { [name: string]: ObjectTypeAnnotation };
      componentPropTypes: { [name: string]: string };
      relayContainerFragments: { [name: string]: Array<string> };
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
              if (isRelayCreateContainer(p) && p.node.type === "CallExpression") {
                const n = p.node;
                const [arg1, arg2] = n.arguments;
                if (arg1.type !== "Identifier" || arg2.type !== "ObjectExpression") {
                  return;
                }

                const reactComponentName = arg1.name;
                const fragments = arg2.properties.filter(_ => _.key.name === "fragments");
                const fragmentNames = fragments.length === 1 ? fragments[0].value.properties.map(_ => _.key.name) : [];
                state.relayContainerFragments[reactComponentName] = fragmentNames;
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

      CallExpression(path: NodePath, state: ActiveVisitorState) {
        const { node, parent } = path;
        if (node.type !== "CallExpression") {
          return;
        }

        if (node.callee.name !== GEN_FRAG_FROM_PROPS_NAME) {
          return;
        }

        const relayCreateContainer = path.findParent(p => t.isCallExpression(p) && isRelayCreateContainer(p));
        if (!relayCreateContainer || relayCreateContainer.node.type !== "CallExpression") {
          return;
        }

        const argPaths = relayCreateContainer.get("arguments");
        const arg1Path = Array.isArray(argPaths) && argPaths[0];
        if (!arg1Path) {
          throw new Error("Could not find first argument for Relay.createContainer");
        }

        const identifierNames = [];
        if (arg1Path.node.type === "Identifier") {
          identifierNames.push(arg1Path.node.name);
        } else {
          arg1Path.traverse({
            Identifier(identifierPath: NodePath) {
              if (identifierPath.node.type === "Identifier") {
                identifierNames.push(identifierPath.node.name);
              }
            }
          });
        }
        const typeName = identifierNames.reduce(
          (result, identifierName) => result || state.componentPropTypes[identifierName],
          null
        );
        if (!typeName) {
          const identifierNamesStr = identifierNames.join(", ");
          throw new Error(`Could not find flow prop types for possible react components [${identifierNamesStr}]`);
        }

        const type = state.flowTypes[typeName];
        if (!type) {
          throw new Error(`There is no flow type object with name ${typeName}`);
        }

        const fragmentKey = parent && t.isProperty(parent) && parent.key.name;
        const typeAtKey = type.properties.find(_ => _.key.name === fragmentKey);
        if (!typeAtKey) {
          throw new Error(`There is no property named '${fragmentKey}' in flow type ${typeName}`);
        }

        let fragmentName = null;
        const fragmentNameLiteral = node.arguments[0];
        if (fragmentNameLiteral && fragmentNameLiteral.type === "StringLiteral") {
          fragmentName = fragmentNameLiteral.value;
        }
        fragmentName = fragmentName || uppercaseFirstChar(typeAtKey.key.name);

        checkPropsObjectTypeMatchesSchema(schema, fragmentName, typeAtKey);
        const graphQlQuery = toGraphQLQueryString(fragmentName, typeAtKey, state.relayContainerFragments);

        // relay needs a start location on the Relay.QL template string
        const start = node.loc.start;
        path.replaceWithSourceString(graphQlQuery);
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
            variables.forEach(variable => {
              state.imports[variable] = filename;
            });
          }
        }

        // remove the marker function import
        if (node.specifiers.find(_ => _.local.name === GEN_FRAG_FROM_PROPS_NAME)) {
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

          if (imports[GEN_FRAG_FROM_PROPS_NAME]) {
            path.traverse(activeVisitor, {
              imports,
              flowTypes,
              componentPropTypes: {},
              relayContainerFragments: {}
            });
          }
        }
      }
    };
  };
}
