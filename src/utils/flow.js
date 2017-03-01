/* @flow */
import type { FlowType, FlowTypes } from "./types";

function flowTypeAnnotationToString(type: TypeTypeAnnotation, nullable: boolean): FlowType {
  switch (type.type) {
    case "BooleanTypeAnnotation":
      return { type: "boolean", nullable };
    case "NumberTypeAnnotation":
      return { type: "number", nullable };
    case "StringTypeAnnotation":
      return { type: "string", nullable };
    default:
      return { type: "any", nullable };
  }
}

// convert an ObjectTypeAnnotation to a js object
function convertFlowObjectTypeAnnotation(
  objectType: ObjectTypeAnnotation,
  flowTypes: { [name: string ]: ObjectTypeAnnotation }
): FlowTypes {
  return objectType.properties.reduce((obj, property) => {
    const key = property.key.name;

    return {
      ...obj,
      [key]: convertTypeAnnotationToFlowType(property.value, property.optional, flowTypes)
    };
  }, {});
}

export function convertTypeAnnotationToFlowType(
  value: TypeTypeAnnotation,
  nullable: boolean,
  flowTypes: { [name: string ]: ObjectTypeAnnotation }
): FlowType {
  if (value.type === "NullableTypeAnnotation") {
    return convertTypeAnnotationToFlowType(value.typeAnnotation, true, flowTypes);
  }

  if (value.type === "GenericTypeAnnotation" && flowTypes[value.id.name]) {
    return convertTypeAnnotationToFlowType(flowTypes[value.id.name], nullable, flowTypes);
  }

  if (value.type === "ObjectTypeAnnotation") {
    return {
      type: "object",
      nullable,
      properties: convertFlowObjectTypeAnnotation(value, flowTypes)
    };
  }

  if (value.type === "ArrayTypeAnnotation") {
    return {
      type: "array",
      nullable,
      child: convertTypeAnnotationToFlowType(value.elementType, nullable, flowTypes)
    };
  }

  return flowTypeAnnotationToString(value, nullable);
}
