/* @flow */
/* eslint no-unused-vars:0 */
import React from "react";
import Relay from "react-relay";

import NonexistentComponet from "./DoesNotExist"; // eslint-disable-line import/extensions, import/no-unresolved

type ArticleProps = {
  article: {
    title: string
  }
};

class Article extends React.Component {
  props: ArticleProps;

  render() {
    const { article } = this.props;
    return <div>{article.title}</div>;
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: () => function () {
      return {
        children: [{
          fieldName: "title",
          kind: "Field",
          metadata: {},
          type: "String"
        }, {
          fieldName: "id",
          kind: "Field",
          metadata: {
            isGenerated: true,
            isRequisite: true
          },
          type: "String"
        }],
        id: Relay.QL.__id(),
        kind: "Fragment",
        metadata: {},
        name: "Source_ArticleRelayQL",
        type: "Article"
      };
    }()
  }
});
