/* @flow */
import React from "react";
import gql from "graphql-tag"; // eslint-disable-line no-unused-vars


type ArticleProps = {
  article: {
    title: string;
    content: string;
  }
};

class Article extends React.Component {
  props: ArticleProps;

  render() {
    const { article } = this.props;
    return <div>
        <div>{article.title}</div>
        <div>{article.content}</div>
      </div>;
  }
}

Article.fragments = {
  article: gql`
fragment ArticleArticleFragment on Article {
  title
  content
}
`
};

export default Article;
