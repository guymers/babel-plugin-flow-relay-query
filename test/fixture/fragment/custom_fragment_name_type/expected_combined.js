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
        <div>{article.content}</div>
      </div>;
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
          fieldName: "content",
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
        name: "BlahFrag",
        type: "Blah"
      };
    }()
  }
});
