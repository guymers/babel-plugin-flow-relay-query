/* @flow */
import React from "react";
import Relay from "react-relay";


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

const Article = ({ article }: ArticleProps) => // eslint-disable-line no-shadow, no-unused-vars
<div>
    <div>{article.title} ({article.posted})</div>
    <div>{article.author.name} [{article.author.email}]</div>
    <div>{article.content}</div>
  </div>;

export default Relay.createContainer(Article, {
  fragments: {
    article: () => Relay.QL`
fragment on Article {
  title,
  posted,
  content,
  author {
    name,
    email
  }
}
`
  }
});
