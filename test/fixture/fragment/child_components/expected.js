/* @flow */
import React from "react";
import Relay from "react-relay";

import ArticleBody from "./ArticleBody";
import ArticleTitle from "./ArticleTitle";

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

class Article extends React.Component {
  props: ArticleProps;

  render() {
    const { article } = this.props;
    return <div>
        <ArticleTitle article={article} />
        <div>{article.author.name} [{article.author.email}]</div>
        <ArticleBody article={article} />
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
  author {
    name,
    email
  },
  ${ ArticleTitle.getFragment('article') },
  ${ ArticleBody.getFragment('article') }
}
`
  }
});
