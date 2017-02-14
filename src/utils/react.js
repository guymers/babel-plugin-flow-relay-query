/* @flow */

function extendsReactComponent(node: ClassDeclaration): boolean {
  const superClass = node.superClass;
  if (superClass && superClass.type === "MemberExpression") {
    return superClass.object.name === "React" && (superClass.property.name === "Component" || superClass.property.name === "PureComponent");
  }
  if (superClass && superClass.type === "Identifier") {
    return superClass.name === "Component" || superClass.name === "PureComponent";
  }
  return false;
}

function findClassProperty(node: ClassDeclaration, propertyName: string): ?ClassProperty {
  const body = node.body.body;
  for (let i = 0; i < body.length; i += 1) {
    const bodyNode = body[i];
    if (bodyNode.type === "ClassProperty" && bodyNode.key.name === propertyName) {
      return bodyNode;
    }
  }
  return null;
}

type ReactComponentClassResult = {
  className: string;
  propType: string;
};

export function parseReactComponentClass(node: ClassDeclaration): ?ReactComponentClassResult {
  if (!extendsReactComponent(node)) {
    return null;
  }

  const result: (n: GenericTypeAnnotation) => ReactComponentClassResult = n => ({
    className: node.id.name,
    propType: n.id.name
  });

  const typeParamAnnotation = node.superTypeParameters && node.superTypeParameters.params[1];
  if (typeParamAnnotation && typeParamAnnotation.type === "GenericTypeAnnotation") {
    return result(typeParamAnnotation);
  }

  const propsClassProperty = findClassProperty(node, "props");
  if (propsClassProperty) {
    const typeAnnotation = propsClassProperty.typeAnnotation && propsClassProperty.typeAnnotation.typeAnnotation;
    if (typeAnnotation && typeAnnotation.type === "GenericTypeAnnotation") {
      return result(typeAnnotation);
    }
  }

  return null;
}
