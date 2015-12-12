/* @flow */
function flowTypeAnnotationToString(type: TypeTypeAnnotation): string {
  switch (type.type) {
    case "BooleanTypeAnnotation":
      return "boolean";
    case "NumberTypeAnnotation":
      return "number";
    case "StringTypeAnnotation":
      return "string";
    default:
      return "any";
  }
}

// convert an ObjectTypeAnnotation to a js object
export function convertFlowObjectTypeAnnotation(objectType: ObjectTypeAnnotation): Object {
  return objectType.properties.reduce((obj, property) => {
    const key = property.key.name;
    const value = property.value;
    if (value.type === "ObjectTypeAnnotation") {
      obj[key] = convertFlowObjectTypeAnnotation(value);
    } else {
      obj[key] = flowTypeAnnotationToString(value);
    }
    return obj;
  }, {});
}
