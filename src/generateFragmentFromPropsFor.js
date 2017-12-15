/* @flow */
import type { FragmentOptions } from "./FragmentOptions";

export default function (component: React$Node, options?: FragmentOptions): Function {
  return () => options;
}
