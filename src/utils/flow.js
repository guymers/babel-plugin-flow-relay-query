/* @flow */
import type { FlowTypes } from "./types";

function flowTypeAnnotationToString(type: TypeTypeAnnotation): string {
  switch (type.type) {
    case "NullableTypeAnnotation":
      return "?" + flowTypeAnnotationToString(type.typeAnnotation);
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
export function convertFlowObjectTypeAnnotation(objectType: ObjectTypeAnnotation): FlowTypes {
  return objectType.properties.reduce((obj, property) => {
    const key = property.key.name;
    const value = property.value;
    if (value.type === "ObjectTypeAnnotation") {
      obj[key] = {
        type: "object",
        nullable: property.optional,
        properties: convertFlowObjectTypeAnnotation(value)
      };
    } else {
      obj[key] = {
        type: flowTypeAnnotationToString(value),
        nullable: property.optional
      };
    }
    return obj;
  }, {});
}
