/* @flow */
import type { FlowType, FlowTypes } from "./types";

function flowTypeAnnotationToString(type: TypeTypeAnnotation, nullable: boolean, fieldName?: string): FlowType {
  switch (type.type) {
    case "BooleanTypeAnnotation":
      return { type: "boolean", nullable, fieldName };
    case "NumberTypeAnnotation":
      return { type: "number", nullable, fieldName };
    case "StringTypeAnnotation":
      return { type: "string", nullable, fieldName };
    default:
      return { type: "any", nullable, fieldName };
  }
}

// convert an ObjectTypeAnnotation to a js object
function convertFlowObjectTypeAnnotation(
  objectType: ObjectTypeAnnotation,
  flowTypes: { [name: string ]: ObjectTypeAnnotation },
  fieldName?: string
): FlowTypes {
  return objectType.properties.reduce((obj, property) => {
    const key = property.key.name;
    // property.optional indicates the presence of a question mark at the end of a field
    // eg. field?: blah
    // given a GraphQL schema cannot represent an optional object key we don't need to care about it
    const nullable = false;

    return {
      ...obj,
      [key]: convertTypeAnnotationToFlowType(property.value, nullable, flowTypes, fieldName)
    };
  }, {});
}

export function convertTypeAnnotationToFlowType(
  value: TypeTypeAnnotation,
  nullable: boolean,
  flowTypes: { [name: string ]: ObjectTypeAnnotation },
  fieldName?: string
): FlowType {
  if (value.type === "NullableTypeAnnotation") {
    return convertTypeAnnotationToFlowType(value.typeAnnotation, true, flowTypes, fieldName);
  }

  if (value.type === "GenericTypeAnnotation") {
    if (flowTypes[value.id.name]) {
      return convertTypeAnnotationToFlowType(flowTypes[value.id.name], nullable, flowTypes, fieldName);
    }

    if (value.typeParameters) {
      if (value.id.name === "AliasFor") {
        const [fieldNameType, type] = value.typeParameters.params;

        return convertTypeAnnotationToFlowType(type, nullable, flowTypes, fieldNameType.value);
      }
    }
  }

  if (value.type === "ObjectTypeAnnotation") {
    return {
      fieldName,
      type: "object",
      nullable,
      properties: convertFlowObjectTypeAnnotation(value, flowTypes)
    };
  }

  if (value.type === "ArrayTypeAnnotation") {
    return {
      type: "array",
      child: convertTypeAnnotationToFlowType(value.elementType, nullable, flowTypes, fieldName)
    };
  }

  return flowTypeAnnotationToString(value, nullable, fieldName);
}
