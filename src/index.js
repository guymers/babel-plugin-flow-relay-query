/* @flow */
import getBabelRelayPlugin from "babel-relay-plugin";
import flowRelayQueryPlugin from "./flowRelayQueryPlugin";

export default function (schemaProvider: Object|Function): Function {
  const babelRelayPlugin = getBabelRelayPlugin(schemaProvider);

  return function plugin(babel) {
    return {
      inherits: babelRelayPlugin(babel),
      ...flowRelayQueryPlugin(babel)
    };
  };
}
