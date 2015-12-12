type BabelFileResult = {
  ast?: ?Object;
  code?: ?string;
  map?: ?Object;
  ignored?: ?boolean;
  metadata?: ?any;
};

declare module "babel-core" {
  declare class Pipeline {
    lint(code: string, opts?: Object): BabelFileResult;
    pretransform(code: string, opts?: Object): BabelFileResult;
    transform(code: string, opts?: Object): BabelFileResult;
    transformFromAst(ast: Object, code: string, opts: Object): BabelFileResult;
  }

  declare function traverse(): void;
}

declare module "babel-core/lib/helpers/resolve" {
  declare function exports(loc: string, relative?: string): ?string;
}

declare class PluginPass extends babelCore$Store {
  plugin: babelCore$Plugin;
  file: babelCore$File;
  opts: Object;

  transform(): void;
}

declare class babelCore$Plugin extends babelCore$Store {
  initialized: boolean;
  raw: Object;
  manipulateOptions: ?Function;
  post: ?Function;
  pre: ?Function;
  visitor: Object;
}

declare class babelCore$Store extends Map {
  dynamicData: Object;
  get(key: string): any;
}

declare class babelCore$File {
  opts: {
    filename: string;
  };
}
