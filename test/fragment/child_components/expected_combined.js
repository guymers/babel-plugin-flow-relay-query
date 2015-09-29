/* @flow */
import React from "react";
import Relay from "react-relay";

import ArticleBody from "./ArticleBody";
import ArticleTitle from "./ArticleTitle";

type ArticleProps = {
  article: {
    title: string;
    posted: string;
    content: string;

    author: {
      name: string;
      email: string;
    };
  }
};

class Article extends React.Component {
  props: ArticleProps;

  render() {
    const { article } = this.props;
    return <div>
        <ArticleTitle article={article} />
        <div>{article.author.name} [{article.author.email}]</div>
        <ArticleBody article={article} />
      </div>;
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: () => (function (sub_0, sub_1) {
      var GraphQL = Relay.QL.__GraphQL;
      return new GraphQL.QueryFragment("Source", "Article", [new GraphQL.Field("title", null, null, null, null, null, {
        parentType: "Article"
      }), new GraphQL.Field("posted", null, null, null, null, null, {
        parentType: "Article"
      }), new GraphQL.Field("content", null, null, null, null, null, {
        parentType: "Article"
      }), new GraphQL.Field("author", [new GraphQL.Field("name", null, null, null, null, null, {
        parentType: "Author"
      }), new GraphQL.Field("email", null, null, null, null, null, {
        parentType: "Author"
      }), new GraphQL.Field("id", null, null, null, null, null, {
        parentType: "Author",
        generated: true,
        requisite: true
      })], null, null, null, null, {
        parentType: "Article"
      }), new GraphQL.Field("id", null, null, null, null, null, {
        parentType: "Article",
        generated: true,
        requisite: true
      })], [Relay.QL.__frag(sub_0), Relay.QL.__frag(sub_1)]);
    })(ArticleTitle.getFragment("article"), ArticleBody.getFragment("article"))
  }
});
