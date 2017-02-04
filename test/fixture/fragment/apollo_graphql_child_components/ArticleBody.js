/* @flow */
import React from "react";
import gql from "graphql-tag"; // eslint-disable-line no-unused-vars
import generateFragmentFromPropsFor from "../../../../src/generateFragmentFromPropsFor";

type ArticleBodyProps = {
  article: {
    content: string
  }
};

class ArticleBody extends React.Component {
  props: ArticleBodyProps;

  render() {
    const { article } = this.props;
    return <div>{article.content}</div>;
  }
}

ArticleBody.fragments = {
  article: generateFragmentFromPropsFor(ArticleBody)
};

export default ArticleBody;
