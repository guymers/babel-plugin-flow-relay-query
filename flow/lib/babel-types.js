declare module "babel-types" {
  declare function isCallExpression(path: any): boolean;
  declare function isClassDeclaration(path: any): boolean;
  declare function isClassProperty(path: any): boolean;
  declare function isGenericTypeAnnotation(path: any): boolean;
  declare function isImportDeclaration(path: any): boolean;
  declare function isProperty(path: any): boolean;

  declare function isJSXIdentifier(path: any): boolean;

  declare function isBooleanTypeAnnotation(path: any): boolean;
  declare function isNumberTypeAnnotation(path: any): boolean;
  declare function isObjectTypeAnnotation(path: any): boolean;
  declare function isStringTypeAnnotation(path: any): boolean;
}
