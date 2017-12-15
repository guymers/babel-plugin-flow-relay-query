/* @flow */
import React from "react";
import Relay from "react-relay";
import generateFragmentFromProps from "../../../../src/generateFragmentFromProps";

type ArticleProps = {
  article: {
    title: string;
    posted: string;
    content: string;
    views: number;
    sponsored: boolean;

    author: {
      name: string;
      email: string;
    }
  }
};

class Article extends React.Component<ArticleProps, void> {
  render() {
    const { article } = this.props;
    return (
      <div>
        <div>{article.title} ({article.posted})</div>
        <div>{article.author.name} [{article.author.email}]</div>
        <div>{article.content}</div>
      </div>
    );
  }
}

const connect = () => Component => Component;

export default Relay.createContainer(connect()(Article), {
  fragments: {
    article: generateFragmentFromProps()
  }
});
