type AstNode =
  Expression |
  Identifier;

type Identifier = {
  type: "Identifier";
  name: string;
}

type Expression =
  CallExpression |
  MemberExpression |
  ObjectExpression;

type ArrowFunctionExpression = {
  type: "ArrowFunctionExpression";
  typeAnnotation: ?any;
  generator: boolean;
  expression: boolean;
  params: Array<any>;
  body: AstNode;
}

type CallExpression = {
  type: "CallExpression";
  callee: Identifier;
  arguments: Array<Identifier | ObjectExpression>;
}

type MemberExpression = {
  type: "MemberExpression";
  object: Identifier;
  property: Identifier;
}

type ObjectExpression = {
  type: "ObjectExpression";
  properties: Array<any>;//<ObjectProperty | ObjectMethod | SpreadProperty>;
  paths: Array<any>;
}

type JSXElement = {
  type: "JSXElement";
  openingElement: JSXOpeningElement;
  closingElement: JSXClosingElement;
  children: Array<AstNode>;
}

type JSXIdentifier = {
  name: string;
}

type JSXOpeningElement = {
  type: "JSXOpeningElement";
  name: JSXIdentifier;
}

type JSXClosingElement = {
  type: "JSXClosingElement";
  name: JSXIdentifier;
}

type TypeAnnotation = {
  type: "TypeAnnotation";
  typeAnnotation?: TypeTypeAnnotation;
}

type GenericTypeAnnotation = {
  type: "GenericTypeAnnotation";
  typeParameters?: any;
  id: Identifier;
}

type TypeAlias = {
  type: "TypeAlias";
  id: Identifier;
  right: TypeTypeAnnotation;
}

type TypeTypeAnnotation = BooleanTypeAnnotation | NumberTypeAnnotation | StringTypeAnnotation | ObjectTypeAnnotation;

type BooleanTypeAnnotation = {
  type: "BooleanTypeAnnotation";
}

type NumberTypeAnnotation = {
  type: "NumberTypeAnnotation";
}

type StringTypeAnnotation = {
  type: "StringTypeAnnotation";
}

type ObjectTypeAnnotation = {
  type: "ObjectTypeAnnotation";
  properties: Array<ObjectTypeProperty>;
}

type ObjectTypeProperty = {
  type: "ObjectTypeProperty";
  key: Identifier;
  value: TypeTypeAnnotation;
  optional: boolean;
}


type ClassProperty = {
  type: "ClassProperty";
  key: Identifier;
  typeAnnotation?: TypeAnnotation;
}

type ClassDeclaration = {
  type: "ClassDeclaration";
  id: Identifier;
  superClass: ?Expression;
}

type Literal = NullLiteral | StringLiteral | BooleanLiteral | NumericLiteral;

type NullLiteral = {
  type: "NullLiteral";
}

type StringLiteral = {
  type: "StringLiteral";
  value: string;
}

type BooleanLiteral = {
  type: "BooleanLiteral";
  value: boolean;
}

type NumericLiteral = {
  type: "NumericLiteral";
  value: number;
}

type ImportDeclaration = {
  type: "ImportDeclaration";
  specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>;
  importKind: string;
  source: Literal;
}

type ImportSpecifier = {
  type: "ImportSpecifier";
  local: Identifier;
  imported: Identifier;
}

type ImportDefaultSpecifier = {
  type: "ImportDefaultSpecifier";
  local: Identifier;
}

type ImportNamespaceSpecifier = {
  type: "ImportNamespaceSpecifier";
  local: Identifier;
}
