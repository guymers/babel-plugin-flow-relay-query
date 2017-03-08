/* @flow */
import React from "react";
import Relay from "react-relay";
import generateFragmentFromProps from "../../../../src/generateFragmentFromProps";

type ArticleGraph = {
  title: string;
  posted: string;
  tags: ?string[];
}

type AuthorGraph = {
  name: string;
  email: string;
  articles: ArticleGraph[];
}

type AuthorProps = {
  author: AuthorGraph;
};

class Author extends React.Component {
  props: AuthorProps;

  render() {
    const { author } = this.props;
    return (
      <div>
        <div>{author.name} ({author.email})</div>
        <ul>
          {author.articles.map(article => (
            <li>
              <div>{article.title} ({article.posted})</div>
              <div>{article.tags.join(", ")}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Relay.createContainer(Author, {
  fragments: {
    author: generateFragmentFromProps()
  }
});
