/* @flow */
/* eslint no-use-before-define:0 */

type FlowBooleanType = { type: "boolean", nullable: boolean, fieldName?: string };
type FlowNumberType = { type: "number", nullable: boolean, fieldName?: string };
type FlowStringType = { type: "string", nullable: boolean, fieldName?: string };
type FlowAnyType = { type: "any", nullable: boolean, fieldName?: string };

export type FlowScalarType = FlowBooleanType | FlowNumberType | FlowStringType | FlowAnyType;
export type FlowObjectType = { type: "object", nullable: boolean, properties: FlowTypes, fieldName?: string };
export type FlowArrayType = { type: "array", child: FlowType, fieldName?: string };
export type FlowType = FlowObjectType | FlowScalarType | FlowArrayType;

export type FlowTypes = { [name: string]: FlowType }
