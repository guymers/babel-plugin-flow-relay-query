/* @flow */
/* eslint no-unused-vars:0 */
import React from "react";
import Relay from "react-relay";

import NonexistentComponet from "./DoesNotExist";

type ArticleProps = {
  article: {
    title: string
  }
};

class Article extends React.Component {
  props: ArticleProps;

  render() {
    const { article } = this.props;
    return <div>{article.title}</div>;
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: () => (function () {
      var GraphQL = Relay.QL.__GraphQL;
      return new GraphQL.QueryFragment("Source", "Article", [new GraphQL.Field("title", null, null, null, null, null, {
        parentType: "Article"
      }), new GraphQL.Field("id", null, null, null, null, null, {
        parentType: "Article",
        generated: true,
        requisite: true
      })]);
    })()
  }
});
