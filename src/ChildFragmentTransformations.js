/* @flow */

export type ChildFragmentTransformations = {
  insideFragment(componentName: string, fragmentKey: string): ?string;
  outsideFragment(componentName: string, fragmentKey: string): ?string;
}

const relay = {
  insideFragment(componentName: string, fragmentKey: string) {
    return `\${${componentName}.getFragment('${fragmentKey}')}`;
  },
  outsideFragment() {
    return null;
  }
};

const uppercaseFirstChar = str => str.charAt(0).toUpperCase() + str.slice(1);

const apolloFragmentName = (componentName: string, fragmentKey: string): string => {
  const fragName = uppercaseFirstChar(fragmentKey);
  return `${componentName}${fragName}Fragment`;
};

const apollo = {
  insideFragment(componentName: string, fragmentKey: string) {
    return `...${apolloFragmentName(componentName, fragmentKey)}`;
  },
  outsideFragment(componentName: string, fragmentKey: string) {
    return `\${${componentName}.fragments.${fragmentKey}}`;
  }
};

export { relay, apollo, apolloFragmentName };
