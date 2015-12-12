/* @flow */
import getBabelRelayPlugin from "babel-relay-plugin";
import flowRelayQueryPlugin from "./flowRelayQueryPlugin";

function createPlugin(schemaProvider: Object|Function): Function {
  const babelRelayPlugin = getBabelRelayPlugin(schemaProvider);

  return function plugin(babel) {
    return {
      inherits: babelRelayPlugin(babel),
      ...flowRelayQueryPlugin(babel)
    };
  };
}

// module.exports because this file will be included using require()
module.exports = createPlugin;
