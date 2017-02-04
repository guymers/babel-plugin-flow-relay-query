/* @flow */
import React from "react";
import gql from "graphql-tag"; // eslint-disable-line no-unused-vars


import ArticleBody from "./ArticleBody";
import ArticleTitle from "./ArticleTitle";
import Footer from "./Footer";

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
        <ArticleTitle article={article} />
        <div>{article.author.name} [{article.author.email}]</div>
        <ArticleBody article={article} />
        <Footer />
      </div>;
  }
}

Article.fragments = {
  article: gql`
fragment ArticleArticleFragment on Article {
  title
  content
  ...ArticleTitleArticleFragment
  ...ArticleBodyArticleFragment
}
${ArticleTitle.fragments.article}
${ArticleBody.fragments.article}
`
};

export default Article;
