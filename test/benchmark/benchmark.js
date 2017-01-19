import Benchmark from "benchmark";
import path from "path";
import { transformFileSync } from "babel-core";
import createSchema from "../../src/createSchema";
import createFlowRelayQueryPlugin from "../../src/flowRelayQueryPlugin";

const schema = require("../data/articleSchema.json");

const flowRelayQueryPlugin = createFlowRelayQueryPlugin(createSchema(schema.data));

const babelOptions = {
  babelrc: false,
  plugins: [
    "syntax-flow",
    "syntax-jsx"
  ]
};

const babelOptionsWithPlugin = {
  babelrc: false,
  plugins: [
    "syntax-flow",
    "syntax-jsx",
    flowRelayQueryPlugin
  ]
};

const parseFile = (file, options = babelOptionsWithPlugin) => {
  const sourceFile = path.resolve(__dirname, file);
  transformFileSync(sourceFile, options);
};

const suite = new Benchmark.Suite();
suite
  .add("without", () => parseFile("basic.js", babelOptions))
  .add("basic", () => parseFile("basic.js"))
  .add("many functions", () => parseFile("many_functions.js"))
  // add listeners
  .on("cycle", event => console.log(String(event.target))) // eslint-disable-line no-console
  .run({ async: true });
