## 0.10.8

* Support array flow types (@kalley)
* Allow Flow to GraphQL type checker to work on all types

## 0.10.7

* Handle React.PureComponent (@kalley)

## 0.10.6

* Handle recursive types that reference each other directly (@kalley)
* Allow types to reference other types (@kalley)

## 0.10.5

* Fix plugin options not getting passed to the plugin

## 0.10.4

* No longer requires the explicit 'Relay.createContainer', only the number and type of arguments to the function matter
* Add additional FragmentOptions ('name' has been renamed to 'type')
* Add a generateFragmentFromPropsFor() marker function which requires an explicit ReactComponent as its first argument
* Support generating Apollo GraphQL fragments

## 0.10.3

* Update to Relay 0.10.0

## 0.10.2

* Update to Relay 0.9.3

## 0.10.1

* Include Flow types for FragmentOptions

## 0.10.0

* Support React Component destructuring (@chollier)
* Update the generateFragmentFromProps() marker function to take an object instead of a string
* Allow fragment directives to be configured via the generateFragmentFromProps() marker function

## 0.9.2

* Update to Relay 0.9.2

## 0.9.1

* Update to Relay 0.9.1

## 0.9.0

* Update to Relay 0.9.0

## 0.8.1

* Update to Relay 0.8.1

## 0.8.0

* Update to Relay 0.8.0

## 0.7.1

* Update to Relay 0.7.3

## 0.7.0

* Update to Relay 0.7

## 0.6.3

* Check prop Flow types against the GraphQL schema

## 0.6.2

* Support inline wrapped React components being passed to Relay.createContainer

## 0.6.1

* Fix invalid type import causing Babel to fail to start

## 0.6.0

* Update to Babel 6, version 5 is no longer supported.
* Support React.Component type parameters
