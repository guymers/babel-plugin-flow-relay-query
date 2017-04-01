/* @flow */
import React from "react";
import Relay from "react-relay";
import generateFragmentFromProps from "../../../../src/generateFragmentFromProps";

import type { AliasFor } from "../../../../src/flowTypes.js.flow";

type ArticleProps = {
  article: {
    title: string;
    posted: string;
    content: string;
    views: number;
    sponsored: boolean;

    writer: AliasFor<'author', {
      fullName: AliasFor<'name', string>;
      email: string;
    }>;
  }
};

class Article extends React.Component {
  props: ArticleProps;

  render() {
    const { article } = this.props;
    return (
      <div>
        <div>{article.title} ({article.posted})</div>
        <div>{article.writer.fullName} [{article.writer.email}]</div>
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
