/* @flow */
import type { FragmentOptions } from "./FragmentOptions";

export default function (component: ReactClass<*>, options?: FragmentOptions): Function {
  return () => options;
}
