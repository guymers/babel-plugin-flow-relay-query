# babel-plugin-flow-relay-query

Babel plugin which converts Flow types into Relay fragments.

## Installation

```sh
npm install --save-dev babel-plugin-flow-relay-query
```

## Usage

Instead of importing ```babel-relay-plugin```, import ```babel-plugin-flow-relay-query```

Replace

```javascript
var getBabelRelayPlugin = require("babel-relay-plugin");
```
with

```javascript
var getBabelRelayPlugin = require("babel-plugin-flow-relay-query");
```

## Example

Create a marker function called ```generateFragmentFromProps```

```javascript
function generateFragmentFromProps(fragmentName?: string): Function {}
```

If ```fragmentName``` is not provided then it will default to the key in the fragments object, capitalized.

```javascript
import generateFragmentFromProps from "./generateFragmentFromProps";

type ArticleProps = {
  article: {
    title: string,
    posted: string,
    content: string,

    author: {
      name: string,
      email: string
    }
  }
};

class Article extends React.Component {
  props: ArticleProps;
  
  render() {
    const { article } = this.props;
    return (
      <div>
        <ArticleTitle article={article} />
        <div>{article.author.name} [{article.author.email}]</div>
        <div>{article.content})</div>
      </div>
    );
  }
}

export default Relay.createContainer(Article, {
  fragments: {
    article: generateFragmentFromProps(),
  },
});
```

The article fragment will be transformed into:

```javascript
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
        ${ArticleTitle.getFragment("article")}
      }
    `
  }
});
```
