/* @flow */
import React from "react";
import Relay from "react-relay";
import generateFragmentFromProps from "../../../src/generateFragmentFromProps";

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

export default Relay.createContainer(ArticleBody, {
  fragments: {
    article: generateFragmentFromProps(),
  },
});
