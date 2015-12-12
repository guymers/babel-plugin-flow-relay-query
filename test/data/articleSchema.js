/* @flow */
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean
} from "graphql";

const authorType = new GraphQLObjectType({
  name: "Author",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    twitter: { type: GraphQLString }
  })
});

const articleType = new GraphQLObjectType({
  name: "Article",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    posted: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    views: { type: new GraphQLNonNull(GraphQLInt) },
    sponsored: { type: new GraphQLNonNull(GraphQLBoolean) },
    author: { type: authorType }
  })
});

const blahType = new GraphQLObjectType({
  name: "Blah",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) }
  })
});

const queryType = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    article: {
      type: articleType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString)
        }
      }
    },
    blah: {
      type: blahType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString)
        }
      }
    }
  })
});

const schema = new GraphQLSchema({
  query: queryType
});
export default schema;
