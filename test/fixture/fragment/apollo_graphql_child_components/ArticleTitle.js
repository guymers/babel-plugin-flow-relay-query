/* @flow */
import React from "react";
import gql from "graphql-tag"; // eslint-disable-line no-unused-vars
import generateFragmentFromPropsFor from "../../../../src/generateFragmentFromPropsFor";

type ArticleTitleProps = {
  article: {
    title: string,
    posted: string,
  }
};

class ArticleTitle extends React.Component {
  props: ArticleTitleProps;

  render() {
    const { article } = this.props;
    return <div>{article.title} ({article.posted})</div>;
  }
}

ArticleTitle.fragments = {
  article: generateFragmentFromPropsFor(ArticleTitle)
};

export default ArticleTitle;
