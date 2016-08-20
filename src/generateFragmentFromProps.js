/* @flow */
import type { FragmentOptions } from "./utils/fragmentOptions";

export default function (options?: FragmentOptions): Function {
  return () => options;
}
