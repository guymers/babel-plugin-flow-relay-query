/* @flow */
import getBabelRelayPlugin from "babel-relay-plugin";
import relayFlowQueryPlugin from "./relayFlowQueryPlugin";

export default function getRelayFlowQueryPlugin(schemaProvider/*: Object | Function*/)/*: Function*/ {
  const babelRelayPlugin = getBabelRelayPlugin(schemaProvider);

  return function relayQueryGroupPlugin(babel) {
    const visitors = [];
    visitors.push(babelRelayPlugin(babel).visitor);
    visitors.push(relayFlowQueryPlugin(babel).visitor);

    const { traverse } = require("babel-core");
    const mergedVisitors = traverse.visitors.merge(visitors);

    return new babel.Plugin("relay-query-group", { visitor: mergedVisitors });
  };
}
