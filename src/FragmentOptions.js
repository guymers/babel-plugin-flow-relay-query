/* @flow */
export type FragmentOptions = {
  name?: string;
  type?: string;
  templateTag?: string;
  directives?: {
    [name: string]: { [arg: string]: boolean|number|string };
  };
}
