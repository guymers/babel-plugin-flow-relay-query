/* @flow */
// copied from getBabelRelayPlugin
// https://github.com/facebook/relay/blob/master/scripts/babel-relay-plugin/src/getBabelRelayPlugin.js
import { buildClientSchema } from "graphql/utilities/buildClientSchema";
import type { GraphQLSchema } from "graphql";

export type GraphQLSchemaProvider = (Object | () => Object);

export default function createSchema(schemaProvider: GraphQLSchemaProvider): GraphQLSchema {
  const introspection = typeof schemaProvider === "function" ? schemaProvider() : schemaProvider;
  return buildClientSchema(introspection);
}
