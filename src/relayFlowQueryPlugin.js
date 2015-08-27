/* @flow */
import fs from "fs";
import path from "path";

function isObject(obj) {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

function uppercaseFirstChar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const generateFragmentFromPropsFunctionName = "generateFragmentFromProps";

declare class PluginClass {
  visitor: Object
}

export default function({ Plugin, types: t }: Object): PluginClass {
  // t.templateElement does not pass args
  // https://github.com/babel/babel/blob/master/packages/babel/src/types/definitions/es2015.js#L123
  const originalTemplateElement = t.templateElement;
  t.templateElement = (value, tail = true) => {
    const templateElement = originalTemplateElement.apply(this, arguments);
    return Object.assign({}, templateElement, { value, tail });
  };

  function flowTypeAnnotationToString(type) {
    if (t.isStringTypeAnnotation(type)) {
      return "string";
    } else if (t.isNumberTypeAnnotation(type)) {
      return "number";
    } else if (t.isBooleanTypeAnnotation(type)) {
      return "boolean";
    }
    return "any";
  }

  // convert an ObjectTypeAnnotation to a js object
  function convertFlowObjectTypeAnnotation(objectType) {
    return objectType.properties.reduce((obj, property) => {
      const key = property.key.name;
      const value = property.value;
      if (t.isObjectTypeAnnotation(value)) {
        obj[key] = convertFlowObjectTypeAnnotation(value);
      } else {
        obj[key] = flowTypeAnnotationToString(value);
      }
      return obj;
    }, {});
  }

  function convertToGraphQLString(obj, level = 1) {
    const indentation = "  ".repeat(level);

    const strings = Object.keys(obj).reduce((parts, key) => {
      const value = obj[key];
      let str = key;
      if (isObject(value)) {
        str = str + " {\n" + convertToGraphQLString(value, level + 1) + "\n" + indentation + "}";
      }
      parts.push(indentation + str);
      return parts;
    }, []);

    return strings.join(",\n");
  }

  function storeTypeAlias(node, state) {
    state.opts.extra.flowTypes = state.opts.extra.flowTypes || {};
    state.opts.extra.flowTypes[node.id.name] = node;
  }

  function storeClassPropTypes(state, className, propType) {
    state.opts.extra.classPropTypes = state.opts.extra.classPropTypes || {};
    state.opts.extra.classPropTypes[className] = propType;
  }

  return new Plugin("flow-relay-query", {
    visitor: {
      TypeAlias(node, parent, scope, state) {
        storeTypeAlias(node, state);
      },

      ClassProperty(node, parent, scope, state) {
        if (node.key.name !== "props") {
          return;
        }

        const typeAnnotation = node.typeAnnotation && node.typeAnnotation.typeAnnotation;
        if (!typeAnnotation || !t.isGenericTypeAnnotation(typeAnnotation)) {
          return;
        }

        const classDec = this.findParent(p => t.isClassDeclaration(p));
        const superClass = classDec && classDec.node && classDec.node.superClass;
        if (!superClass || superClass.object.name !== "React" || superClass.property.name !== "Component") {
          return;
        }

        const className = classDec.node.id.name;
        const propType = typeAnnotation.id.name;

        storeClassPropTypes(state, className, propType);
      },

      ImportDeclaration(node, parent, scope, state) {
        // handle imported types
        if (node.importKind === "type" || node.importKind === "typeof") {
          const typeNames = node.specifiers.map(specifier => specifier.local.name);
          const filename = state.opts.filename;

          if (!filename) {
            throw new Error(`Imported types ${typeNames.join(", ")} but there is no current file`);
          }

          const importFile = node.source.value;
          const importFilename = path.resolve(path.dirname(filename), `${importFile}.js`);

          // hack to get the imported type
          const babel = require("babel-core");
          const program = babel.parse(fs.readFileSync(importFilename, "utf8"));

          const visitor = {
            TypeAlias(n) {
              const typeName = n.id.name;
              if (typeNames.indexOf(typeName) >= 0) {
                storeTypeAlias(n, state);
              }
            }
          };
          babel.traverse(program, visitor, null, program);
        }

        // remove the marker function import
        const remove = node.specifiers.filter(specifier => {
          return specifier.local.name === generateFragmentFromPropsFunctionName;
        }).length > 0;

        if (remove) {
          this.dangerouslyRemove();
        }
      },

      CallExpression(node, parent, scope, state) {
        if (!t.isIdentifier(node.callee, { name: generateFragmentFromPropsFunctionName })) {
          return this;
        }

        const relayCreateContainer = this.findParent(p => {
          return t.isCallExpression(p) && p.get("callee").matchesPattern("Relay.createContainer");
        });

        if (!relayCreateContainer) {
          return this;
        }

        const reactClassName = relayCreateContainer.node.arguments[0].name;
        const typeName = state.opts.extra.classPropTypes && state.opts.extra.classPropTypes[reactClassName];
        if (!typeName) {
          throw new Error(`React class ${reactClassName} does not have flow typed props`);
        }

        const type = state.opts.extra.flowTypes && state.opts.extra.flowTypes[typeName];
        if (!type) {
          throw new Error(`There is no flow type with name ${typeName}`);
        }

        const typeKey = t.isProperty(parent) && parent.key.name;
        const typeProperties = type.right.properties;

        let typeAtKey = null;
        for (let i = 0; i < typeProperties.length; i++) {
          const typeProperty = typeProperties[i];
          if (t.isObjectTypeProperty(typeProperty) && typeProperty.key.name === typeKey) {
            typeAtKey = typeProperty.value;
          }
        }

        if (!typeAtKey) {
          throw new Error(`There is no property named '${typeKey}' in flow type ${typeName}`);
        }

        if (!t.isObjectTypeAnnotation(typeAtKey)) {
          throw new Error(`Flow type ${typeName}.${typeKey} is not an object`);
        }

        const obj = convertFlowObjectTypeAnnotation(typeAtKey);
        const graphQlQueryBody = convertToGraphQLString(obj);

        const fragmentName = node.arguments[1] && node.arguments[1].value || uppercaseFirstChar(typeKey);
        const graphQlQuery = "\n" +
          "fragment on " + fragmentName + " {\n" +
          graphQlQueryBody + "\n" +
          "}\n";

        const relayQl = t.taggedTemplateExpression(
          t.memberExpression(t.identifier("Relay"), t.identifier("QL")),
          t.templateLiteral([t.templateElement({ cooked: graphQlQuery, raw: graphQlQuery })], [])
        );
        return t.arrowFunctionExpression([], relayQl);
      }
    }
  });
}
