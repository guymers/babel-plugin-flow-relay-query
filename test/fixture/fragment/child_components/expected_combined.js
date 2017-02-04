/* @flow */
import React from "react";
import Relay from "react-relay";


import ArticleBody from "./ArticleBody";
import ArticleTitle from "./ArticleTitle";
import Footer from "./Footer";

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
        <Footer />
      </div>;
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: () => function (RQL_0, RQL_1) {
      return {
        children: [].concat.apply([], [{
          fieldName: "title",
          kind: "Field",
          metadata: {},
          type: "String"
        }, {
          fieldName: "posted",
          kind: "Field",
          metadata: {},
          type: "String"
        }, {
          fieldName: "content",
          kind: "Field",
          metadata: {},
          type: "String"
        }, {
          children: [{
            fieldName: "name",
            kind: "Field",
            metadata: {},
            type: "String"
          }, {
            fieldName: "email",
            kind: "Field",
            metadata: {},
            type: "String"
          }, {
            fieldName: "id",
            kind: "Field",
            metadata: {
              isGenerated: true,
              isRequisite: true
            },
            type: "String"
          }],
          fieldName: "author",
          kind: "Field",
          metadata: {
            canHaveSubselections: true
          },
          type: "Author"
        }, {
          fieldName: "id",
          kind: "Field",
          metadata: {
            isGenerated: true,
            isRequisite: true
          },
          type: "String"
        }, Relay.QL.__frag(RQL_0), Relay.QL.__frag(RQL_1)]),
        id: Relay.QL.__id(),
        kind: "Fragment",
        metadata: {},
        name: "Source_ArticleRelayQL",
        type: "Article"
      };
    }(ArticleTitle.getFragment('article'), ArticleBody.getFragment('article'))
  }
});
