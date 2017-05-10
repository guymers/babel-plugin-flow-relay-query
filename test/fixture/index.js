/* eslint no-loop-func:0 */
import fs from "fs";
import path from "path";
import glob from "glob";
import { describe, it } from "mocha";
import assert from "assert";
import { transformFileSync } from "babel-core";
import createSchema from "../../src/createSchema";
import createFlowRelayQueryPlugin from "../../src/flowRelayQueryPlugin";
import pluginDef from "../../src";

const schema = require("../data/articleSchema.json");

const cwd = __dirname;
const files = glob.sync("**/source.js", { cwd, realpath: true });
const tests = files.reduce((_tests, file) => {
  const folder = path.dirname(file);
  const name = folder.substr(cwd.length + 1);
  _tests.push({ folder, name });
  return _tests;
}, []);

const createBabelOptions = plugin => ({
  babelrc: false,
  plugins: [
    "syntax-flow",
    "syntax-jsx",
    plugin
  ]
});
const customBabelOptions = options => createBabelOptions(createFlowRelayQueryPlugin(createSchema(schema.data), options));
const babelOptions = customBabelOptions({});
const itBabelOptions = createBabelOptions(pluginDef(schema.data));

function test(folder, options, expectedFile) {
  const optionsFile = path.resolve(folder, "options.js");
  if (fs.existsSync(optionsFile)) {
    options = customBabelOptions(require(optionsFile)); // eslint-disable-line no-param-reassign, global-require, import/no-dynamic-require
  }

  let result = "";
  try {
    const sourceFile = path.resolve(folder, "source.js");
    result = transformFileSync(sourceFile, options).code;
  } catch (e) {
    result = e.message;
  }

  const expected = fs.readFileSync(path.resolve(folder, expectedFile), "utf8");

  assert.equal(result.trim(), expected.trim().replace("{PROJECT_ROOT}", path.resolve(cwd, "../..")));
}

describe("", () => {
  tests.forEach(({ folder, name }) => {
    it(name, () => test(folder, babelOptions, "expected.js"));
    it(`${name} - combined`, () => test(folder, itBabelOptions, "expected_combined.js"));
  });
});
