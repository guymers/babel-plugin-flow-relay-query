/* @flow */
import React from "react";
import Relay from "react-relay";


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
        <div>{article.content})</div>
      </div>;
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: () => Relay.QL`
fragment on Article @relay(plural: true) {
  title,
  content
}
`
  }
});
