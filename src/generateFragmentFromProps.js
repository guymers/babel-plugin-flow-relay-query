/* @flow */
export default function (fragmentName?: string): Function {
  return () => fragmentName;
}
