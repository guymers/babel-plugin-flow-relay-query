/* @flow */
import type { NodePath } from "babel-traverse";
import type PluginPass from "babel-core/lib/transformation/plugin-pass";

import { isTypeImport, parseImport } from "./utils/import";
import { isRelayCreateContainer, parseReactComponentClass } from "./utils/react";
import { parseFile } from "./utils/parse";
import { toGraphQLQueryString } from "./utils/graphql";

const GEN_FRAG_FROM_PROPS_NAME = "generateFragmentFromProps";

type PluginInput = {
  types: Object;
};
type PluginDef = {
  visitor: Object;
}

export default function (plugin: PluginInput): PluginDef {
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

      const relayCreateContainerArgs = relayCreateContainer.node.arguments;
      let reactComponentName = "";
      const arg1 = relayCreateContainerArgs[0];
      if (arg1 && arg1.type === "Identifier") {
        reactComponentName = arg1.name;
      }
      const typeName = state.componentPropTypes[reactComponentName];
      if (!typeName) {
        throw new Error(`React component ${reactComponentName} does not have flow typed props`);
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
      const graphQlQuery = toGraphQLQueryString(typeAtKey, state.relayContainerFragments, fragmentName);
      path.replaceWithSourceString(graphQlQuery);
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
          variables.forEach(variable => state.imports[variable] = filename);
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
}
