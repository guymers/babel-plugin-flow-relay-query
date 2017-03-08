/* @flow */
import React from "react";
import Relay from "react-relay";


type ArticleGraph = {
  title: string;
  posted: string;
  tags: ?string[];
};

type AuthorGraph = {
  name: string;
  email: string;
  articles: ArticleGraph[];
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
          {author.articles.map(article => <li>
              <div>{article.title} ({article.posted})</div>
              <div>{article.tags.join(", ")}</div>
            </li>)}
        </ul>
      </div>;
  }
}

export default Relay.createContainer(Author, {
  fragments: {
    author: () => function () {
      return {
        children: [{
          fieldName: "name",
          kind: "Field",
          metadata: {},
          type: "String"
        }, {
          fieldName: "email",
          kind: "Field",
          metadata: {},
          type: "String"
        }, {
          children: [{
            fieldName: "title",
            kind: "Field",
            metadata: {},
            type: "String"
          }, {
            fieldName: "posted",
            kind: "Field",
            metadata: {},
            type: "String"
          }, {
            fieldName: "tags",
            kind: "Field",
            metadata: {
              isPlural: true
            },
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
          fieldName: "articles",
          kind: "Field",
          metadata: {
            canHaveSubselections: true,
            isPlural: true
          },
          type: "Article"
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
        name: "Source_AuthorRelayQL",
        type: "Author"
      };
    }()
  }
});
