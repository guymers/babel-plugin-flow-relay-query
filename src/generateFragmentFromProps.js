/* @flow */
import type { FragmentOptions } from "./FragmentOptions";

export default function (options?: FragmentOptions): Function {
  return () => options;
}
