/* @flow */
import React from "react";
import Relay from "react-relay";

import type { AuthorGraph } from "./type";

type ArticleGraph = {
  title: string;
  posted: string;
  content: string;
  views: number;
  sponsored: boolean;

  author: AuthorGraph;
};

type ArticleProps = {
  article: ArticleGraph
};

class Article extends React.Component {
  props: ArticleProps;

  render() {
    const { article } = this.props;
    return <div>
        <div>{article.title} ({article.posted})</div>
        <div>{article.author.name} [{article.author.email}]</div>
        <div>{article.content}</div>
      </div>;
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: () => Relay.QL`
fragment on Article {
  title
  posted
  content
  views
  sponsored
  author {
    name
    email
  }
}
`
  }
});
