/* @flow */
import * as t from "babel-types";
import type { NodePath } from "babel-traverse";

export function isRelayCreateContainer(path: NodePath): boolean {
  return path.get("callee").matchesPattern("Relay.createContainer");
}

function extendsReactComponent(node: ClassDeclaration): boolean {
  const superClass = node.superClass;
  if (superClass && superClass.type === "MemberExpression") {
    return superClass.object.name === "React" && superClass.property.name === "Component";
  }
  return false;
}

function findGenericTypeAnnotation(node: AstNode): ?GenericTypeAnnotation {
  const typeAnnotation = node.typeAnnotation && node.typeAnnotation.typeAnnotation;
  if (typeAnnotation && t.isGenericTypeAnnotation(typeAnnotation) && typeAnnotation.type === "GenericTypeAnnotation") {
    return typeAnnotation;
  }
  return null;
}

type ReactComponentClassResult = {
  className: string;
  propType: string;
};

export function parseReactComponentClass(path: NodePath): ?ReactComponentClassResult {
  const node = path.node;
  if (node.type !== "ClassProperty") {
    return null;
  }

  if (node.key.name !== "props") {
    return null;
  }

  const genericTypeAnnotation = findGenericTypeAnnotation(node);
  if (!genericTypeAnnotation) {
    return null;
  }

  const classDeclarationPath = path.findParent(_ => t.isClassDeclaration(_.node));
  const classDeclaration = classDeclarationPath && classDeclarationPath.node;
  if (classDeclaration && classDeclaration.type === "ClassDeclaration" && extendsReactComponent(classDeclaration)) {
    const className = classDeclaration.id.name;
    const propType = genericTypeAnnotation.id.name;

    return { className, propType };
  }

  return null;
}
