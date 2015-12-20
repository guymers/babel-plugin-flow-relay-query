/* @flow */
import getBabelRelayPlugin from "babel-relay-plugin";
import createFlowRelayQueryPlugin from "./flowRelayQueryPlugin";
import createSchema from "./createSchema";
import type { GraphQLSchemaProvider } from "./createSchema";

function createPlugin(schemaProvider: GraphQLSchemaProvider, pluginOptions?: Object): Function {
  const babelRelayPlugin = getBabelRelayPlugin(schemaProvider, pluginOptions);

  const schema = createSchema(schemaProvider);
  const flowRelayQueryPlugin = createFlowRelayQueryPlugin(schema);

  return function plugin(babel) {
    return {
      inherits: babelRelayPlugin(babel),
      ...flowRelayQueryPlugin(babel)
    };
  };
}

// module.exports because this file will be included using require()
module.exports = createPlugin;
