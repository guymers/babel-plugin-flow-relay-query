/* @flow */
import React from "react";
import Relay from "react-relay";


type ArticleGraph = {
  title: string;
  posted: string;
};

type AuthorGraph = {
  name: string;
  email: string;
  articles?: ArticleGraph[];
};

type AuthorProps = {
  author: AuthorGraph
};

class Author extends React.Component {
  props: AuthorProps;

  render() {
    const { author } = this.props;
    return <div>
        <div>{author.name} ({author.email})</div>
        <ul>
          {author.articles.map(article => <li>{article.title} ({article.posted})</li>)}
        </ul>
      </div>;
  }
}

export default Relay.createContainer(Author, {
  fragments: {
    author: () => Relay.QL`
fragment on Author {
  name
  email
  articles {
    title
    posted
  }
}
`
  }
});
