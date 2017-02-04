# babel-plugin-flow-relay-query

Babel plugin which converts Flow types into GraphQL fragments.

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

Create a marker function called ```generateFragmentFromProps``` or ```generateFragmentFromPropsFor```:

```javascript
type FragmentOptions = {
  name?: string;
  type?: string;
  templateTag?: string;
  directives?: {
    [name: string]: { [arg: string]: boolean|number|string };
  };
}

function generateFragmentFromProps(options?: FragmentOptions): Function {}
function generateFragmentFromPropsFor(component: ReactClass<*>, options?: FragmentOptions): Function {}
```

Or just import one of the ones that are shipped with the plugin:

```javscript
import { generateFragmentFromProps } from "babel-plugin-flow-relay-query/lib/markers";
import { generateFragmentFromPropsFor } from "babel-plugin-flow-relay-query/lib/markers";
```

If a fragment type is not provided in the options then it will default to the key in the fragments object, capitalized.

```javascript
import React from "react";
import Relay from "react-relay";
import { generateFragmentFromProps } from "babel-plugin-flow-relay-query/lib/markers";

type ArticleProps = {
  article: {
    title: string;
    posted: string;
    content: string;

    author: {
      name: string;
      email: string;
    }
  }
};

class Article extends React.Component<void, ArticleProps, void> {
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

Also supports class properties and functional components:

```javascript
class Article extends React.Component {
  props: ArticleProps;
  ...
}
```

```javascript
const Article = ({ article }: ArticleProps) => (
  <div>
    <div>{article.title} ({article.posted})</div>
    <div>{article.author.name} [{article.author.email}]</div>
    <div>{article.content})</div>
  </div>
);
```

This plugin can also create GraphQL strings for Apollo:

First set apollo generation options globally:

```javascript
var ChildFragmentTransformations = require("babel-plugin-flow-relay-query/lib/ChildFragmentTransformations");
var babelRelayPlugin = require("babel-plugin-flow-relay-query");
const schema = require("??/schema.json");
module.exports = babelRelayPlugin(schema.data, {}, {
  defaultTemplateTag: "gql",
  defaultFragmentName: ChildFragmentTransformations.apolloFragmentName,
  childFragmentTransformations: ChildFragmentTransformations.apollo
});
```

```javascript
import React from "react";
import gql from "graphql-tag";
import { generateFragmentFromPropsFor } from "babel-plugin-flow-relay-query/lib/markers";

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
    return (
      <div>
        <ArticleTitle article={article} />
        <div>{article.author.name} [{article.author.email}]</div>
        <ArticleBody article={article} />
        <Footer />
      </div>
    );
  }
}

Article.fragments = {
  article: generateFragmentFromPropsFor(Article)
};

export default Article;
```
