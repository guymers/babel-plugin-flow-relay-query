/* @flow */
import React from "react";
import Relay from "react-relay";

type ArticleProps = {
  article: {
    title: string;
    content: string;
  }
};

class Article extends React.Component {
  props: ArticleProps;

  render() {
    const { article } = this.props;
    return <div>
        <div>{article.title}</div>
        <div>{article.content})</div>
      </div>;
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: () => (function () {
      var GraphQL = Relay.QL.__GraphQL;
      return new GraphQL.QueryFragment("Source", "Blah", [new GraphQL.Field("title", null, null, null, null, null, {
        "parentType": "Blah"
      }), new GraphQL.Field("content", null, null, null, null, null, {
        "parentType": "Blah"
      }), new GraphQL.Field("id", null, null, null, null, null, {
        "parentType": "Blah",
        "generated": true,
        "requisite": true
      })]);
    })()
  }
});
