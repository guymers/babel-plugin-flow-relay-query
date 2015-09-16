/* @flow */
import React from "react";
import Relay from "react-relay";
import generateFragmentFromProps from "../../../src/generateFragmentFromProps";

type ArticleProps = {
  article: {
    title: string,
    posted: string,
    content: string,

    author: {
      name: string,
      email: string
    }
  }
};

const Article = ({ article }: ArticleProps) => (
  <div>
    <div>{article.title} ({article.posted})</div>
    <div>{article.author.name} [{article.author.email}]</div>
    <div>{article.content})</div>
  </div>
);

export default Relay.createContainer(Article, {
  fragments: {
    article: generateFragmentFromProps(),
  },
});
