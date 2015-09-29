/* @flow */
import React from "react";
import Relay from "react-relay";

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
        <div>{article.title} ({article.posted})</div>
        <div>{article.author.name} [{article.author.email}]</div>
        <div>{article.content})</div>
      </div>;
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: () => (function () {
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
      })]);
    })()
  }
});
