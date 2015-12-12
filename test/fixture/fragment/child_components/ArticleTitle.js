/* @flow */
import React from "react";
import Relay from "react-relay";
import generateFragmentFromProps from "../../../../src/generateFragmentFromProps";

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

export default Relay.createContainer(ArticleTitle, {
  fragments: {
    article: generateFragmentFromProps()
  }
});
