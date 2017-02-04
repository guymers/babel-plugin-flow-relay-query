/* @flow */
import React from "react";
import gql from "graphql-tag"; // eslint-disable-line no-unused-vars
import generateFragmentFromPropsFor from "../../../../src/generateFragmentFromPropsFor";

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
    return (
      <div>
        <div>{article.title}</div>
        <div>{article.content}</div>
      </div>
    );
  }
}

Article.fragments = {
  article: generateFragmentFromPropsFor(Article, { templateTag: "gql" })
};

export default Article;
