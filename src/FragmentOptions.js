/* @flow */
export type FragmentOptions = {
  name?: string,
  directives?: {
    [name: string]: { [arg: string]: boolean|number|string }
  }
}
