/* @flow */
import path from "path";
import resolve from "babel-core/lib/helpers/resolve";

export function isTypeImport(node: ImportDeclaration): boolean {
  return node.importKind === "type" || node.importKind === "typeof";
}

type ParseInputResult = { filename: string, variables: Array<string> };
export function parseImport(node: ImportDeclaration, currentFilename: string): ?ParseInputResult {
  if (node.source.type !== "StringLiteral") {
    return null;
  }

  let importFile = node.source.value;
  if (importFile[0] === ".") {
    // turn a relative path into an absolute path
    importFile = path.resolve(path.dirname(currentFilename), importFile);
  }
  const filename = resolve(importFile);

  if (filename) {
    const variables = node.specifiers.map(_ => _.local.name);
    return { filename, variables };
  }

  return null;
}
