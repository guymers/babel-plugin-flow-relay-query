/* @flow */
import React from "react";
import Relay from "react-relay";
import generateFragmentFromProps from "../../src/generateFragmentFromProps";

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

const RelayLike = {
  create(arg1, arg2) {
    return [arg1, arg2];
  }
};

RelayLike.create(0, 1);
RelayLike.create(0, 2);
RelayLike.create(0, 3);
RelayLike.create(0, 4);
RelayLike.create(0, 5);
RelayLike.create(0, 6);
RelayLike.create(0, 7);
RelayLike.create(0, 8);
RelayLike.create(0, 9);

class Article extends React.Component {
  props: ArticleProps;

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

export default Relay.createContainer(Article, {
  fragments: {
    article: generateFragmentFromProps()
  }
});
