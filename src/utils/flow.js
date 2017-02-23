/* @flow */
import type { FlowTypes } from "./types";

function flowTypeAnnotationToString(type: TypeTypeAnnotation): string {
  switch (type.type) {
    case "NullableTypeAnnotation":
      return `?${flowTypeAnnotationToString(type.typeAnnotation)}`;
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
export function convertFlowObjectTypeAnnotation(
  objectType: ObjectTypeAnnotation,
  flowTypes: { [name: string ]: ObjectTypeAnnotation } = {}
): FlowTypes {
  return objectType.properties.reduce((obj, property) => {
    const key = property.key.name;
    const value = property.value;
    if (value.type === "ObjectTypeAnnotation") {
      return {
        ...obj,
        [key]: {
          type: "object",
          nullable: property.optional,
          properties: convertFlowObjectTypeAnnotation(value, flowTypes)
        }
      };
    }

    if (value.type === "GenericTypeAnnotation" && value.id && flowTypes[value.id.name]) {
      return {
        ...obj,
        [key]: {
          type: "object",
          nullable: property.optional,
          properties: convertFlowObjectTypeAnnotation(flowTypes[value.id.name], flowTypes)
        }
      };
    }

    if (value.type === "ArrayTypeAnnotation" && value.elementType) {
      const children = value.elementType.id && flowTypes[value.elementType.id.name]
        ? flowTypes[value.elementType.id.name]
        : value.elementType;

      return {
        ...obj,
        [key]: {
          type: "array",
          nullable: property.optional,
          children: children.properties ? convertFlowObjectTypeAnnotation(children, flowTypes) : null
        }
      };
    }

    return {
      ...obj,
      [key]: {
        type: flowTypeAnnotationToString(value),
        nullable: property.optional
      }
    };
  }, {});
}
