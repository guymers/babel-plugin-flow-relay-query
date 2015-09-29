/* eslint no-loop-func:0 */
import fs from "fs";
import path from "path";
import glob from "glob";
import assert from "assert";
import * as babel from "babel";
import relayFlowQueryPlugin from "../src/relayFlowQueryPlugin";
import pluginDef from "../src";

const schema = require("./articleSchema.json");
const plugin = pluginDef(schema.data);

const cwd = __dirname;
const files = glob.sync("**/source.js", { cwd, realpath: true });
const tests = files.reduce((_tests, file) => {
  const folder = path.dirname(file);
  const name = folder.substr(cwd.length + 1);
  _tests.push({ folder, name });
  return _tests;
}, []);

const transformers = Object.keys(babel.transform.pipeline.transformers);
const baseOptions = {
  blacklist: transformers
};
const babelOptions = { ...baseOptions, plugins: [ relayFlowQueryPlugin ] };
const itBabelOptions = { ...baseOptions, plugins: [ plugin ] };

function test(folder, options, expectedFile) {
  const sourceFile = path.resolve(folder, "source.js");
  const result = babel.transformFileSync(sourceFile, options).code;
  const expected = fs.readFileSync(path.resolve(folder, expectedFile), "utf8");

  assert.equal(result.trim(), expected.trim());
}

describe("", () => {
  for (const { folder, name } of tests) {
    it(name, () => test(folder, babelOptions, "expected.js"));
    it("name - combined", () => test(folder, itBabelOptions, "expected_combined.js"));
  }
});
