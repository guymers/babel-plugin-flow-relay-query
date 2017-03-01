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

function resolveFlowTypeAnnotation(
  objectType: TypeTypeAnnotation,
  flowTypes: { [name: string ]: ObjectTypeAnnotation }
): TypeTypeAnnotation {
  if (objectType.type === "GenericTypeAnnotation" && objectType.id && flowTypes[objectType.id.name]) {
    return flowTypes[objectType.id.name];
  }

  return objectType;
}

// convert an ObjectTypeAnnotation to a js object
export function convertFlowObjectTypeAnnotation(
  objectType: ObjectTypeAnnotation,
  flowTypes: { [name: string ]: ObjectTypeAnnotation } = {}
): FlowTypes {
  return objectType.properties.reduce((obj, property) => {
    const key = property.key.name;
    const value = resolveFlowTypeAnnotation(property.value, flowTypes);

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

    if (value.type === "ArrayTypeAnnotation" && value.elementType) {
      const children = resolveFlowTypeAnnotation(value.elementType, flowTypes);

      return {
        ...obj,
        [key]: {
          type: "array",
          nullable: property.optional,
          children: children.type === "ObjectTypeAnnotation" ? convertFlowObjectTypeAnnotation(children, flowTypes) : null
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
