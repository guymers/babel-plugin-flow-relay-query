/* @flow */
import fs from "fs";
import { Pipeline, traverse } from "babel-core";

// see pipeline.transform at https://github.com/babel/babel/blob/master/packages/babel-core/src/api/node.js#L34
const pipeline = new Pipeline();
const pretransform = pipeline.pretransform.bind(pipeline);

// options to pass to babel when parsing a file, includes all syntax plugins from es2015, react and stage-0
const parseFileBabelOptions = {
  plugins: [
    "syntax-async-functions",
    "syntax-class-constructor-call",
    "syntax-class-properties",
    "syntax-decorators",
    "syntax-do-expressions",
    "syntax-exponentiation-operator",
    "syntax-export-extensions",
    "syntax-flow",
    "syntax-function-bind",
    "syntax-jsx",
    "syntax-object-rest-spread",
    "syntax-trailing-function-commas"
  ]
};

export function parseFile(filename: string, visitor: Object, state: Object): void {
  const code = fs.readFileSync(filename, "utf8");
  const file = pretransform(code, parseFileBabelOptions);

  traverse(file.ast, visitor, null, state);
}
