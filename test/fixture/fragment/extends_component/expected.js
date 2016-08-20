/* @flow */
import React, { Component } from "react";
import Relay from "react-relay";


type ArticleProps = {
  article: {
    title: string;
    posted: string;
    content: string;
    views: number;
    sponsored: bool;

    author: {
      name: string;
      email: string;
    };
  }
};

class Article extends Component {
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
    article: () => Relay.QL`
fragment on Article {
  title,
  posted,
  content,
  views,
  sponsored,
  author {
    name,
    email
  }
}
`
  }
});
