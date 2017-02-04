const ChildFragmentTransformations = require("../../src/ChildFragmentTransformations"); // eslint-disable-line import/no-unresolved

module.exports = {
  defaultTemplateTag: "gql",
  defaultFragmentName: ChildFragmentTransformations.apolloFragmentName,
  childFragmentTransformations: ChildFragmentTransformations.apollo
};
