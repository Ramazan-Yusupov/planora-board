import type { BoardElement, ElementType } from "../model/types";

const LABEL_CAPABLE_TYPES = new Set<ElementType>([
  "rectangle",
  "badge",
  "ellipse",
  "diamond",
  "triangle",
  "hexagon",
  "star",
  "cloud",
  "line",
  "arrow",
]);

const TITLE_CAPABLE_TYPES = new Set<ElementType>(["code", "embed", "markdown"]);

const TEXT_CONTENT_TYPES = new Set<ElementType>([
  "text",
  "sticky",
  "callout",
  "table",
  "markdown",
  "code",
]);

const CONNECTOR_TARGET_TYPES = new Set<ElementType>([
  "rectangle",
  "ellipse",
  "diamond",
  "triangle",
  "hexagon",
  "badge",
  "star",
  "cloud",
  "sticky",
  "callout",
  "table",
  "frame",
  "embed",
  "markdown",
  "code",
  "image",
]);

const ENDPOINT_EDITABLE_TYPES = new Set<ElementType>([
  "line",
  "arrow",
  "measure",
]);

export type ElementCapabilities = {
  canUseLabel: boolean;
  canUseTitle: boolean;
  canEditTextContent: boolean;
  canUseConnectorAnchors: boolean;
  canEditEndpoints: boolean;
  canContainChildren: boolean;
  canUseLink: boolean;
};

export function getElementCapabilities(
  elementOrType: BoardElement | ElementType,
): ElementCapabilities {
  const type =
    typeof elementOrType === "string" ? elementOrType : elementOrType.type;

  return {
    canUseLabel: LABEL_CAPABLE_TYPES.has(type),
    canUseTitle: TITLE_CAPABLE_TYPES.has(type),
    canEditTextContent: TEXT_CONTENT_TYPES.has(type),
    canUseConnectorAnchors: CONNECTOR_TARGET_TYPES.has(type),
    canEditEndpoints: ENDPOINT_EDITABLE_TYPES.has(type),
    canContainChildren: type === "frame",
    canUseLink: type !== "freedraw" && type !== "highlighter",
  };
}

export function canUseElementLabel(element: BoardElement) {
  return getElementCapabilities(element).canUseLabel;
}

export function canUseElementTitle(element: BoardElement) {
  return getElementCapabilities(element).canUseTitle;
}

export function canUseConnectorAnchors(element: BoardElement) {
  return getElementCapabilities(element).canUseConnectorAnchors;
}

