declare module "babel-traverse" {
  declare class Hub {}
  declare class TraversalContext {}
  declare class Scope {}

  declare class NodePath {
    parent: Object;
    hub: Hub;
    contexts: Array<TraversalContext>;
    data: Object;
    shouldSkip: boolean;
    shouldStop: boolean;
    removed: boolean;
    state: any;
    opts: ?Object;
    skipKeys: ?Object;
    parentPath: ?NodePath;
    context: TraversalContext;
    container: ?Object | Array<Object>;
    listKey: ?string;
    inList: boolean;
    parentKey: ?string;
    key: ?string;
    node: AstNode;
    scope: Scope;
    type: ?string;
    typeAnnotation: ?Object;

    get(s: string): NodePath;

    findParent<T>(callback: (path: NodePath) => boolean): ?NodePath;
    matchesPattern(pattern: string, allowPartial?: boolean): boolean;
    remove(): void;
    replaceWithSourceString(replacement: string): void;
    traverse(visitor: Object, state?: any): void;
  }
}
