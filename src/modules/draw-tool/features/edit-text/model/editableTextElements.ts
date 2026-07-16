import type {
  BoardElement,
  CalloutElement,
  StickyElement,
  TextElement,
} from "@/modules/draw-tool/entities/element";

export type EditableTextElement = TextElement | StickyElement | CalloutElement;

export type EditableLabelElement = Extract<
  BoardElement,
  {
    type:
      | "arrow"
      | "badge"
      | "cloud"
      | "diamond"
      | "ellipse"
      | "hexagon"
      | "line"
      | "rectangle"
      | "star"
      | "triangle";
  }
>;

export function isEditableTextElement(
  element: BoardElement | null | undefined,
): element is EditableTextElement {
  return (
    element?.type === "text" ||
    element?.type === "sticky" ||
    element?.type === "callout"
  );
}

export function isEditableLabelElement(
  element: BoardElement | null | undefined,
): element is EditableLabelElement {
  return Boolean(
    element &&
      (element.type === "badge" ||
        element.type === "rectangle" ||
        element.type === "ellipse" ||
        element.type === "diamond" ||
        element.type === "triangle" ||
        element.type === "hexagon" ||
        element.type === "star" ||
        element.type === "cloud" ||
        element.type === "line" ||
        element.type === "arrow"),
  );
}

export function cloneTextElement(
  element: EditableTextElement,
): EditableTextElement {
  return { ...element, style: { ...element.style } };
}

export function getTextAlign(element: EditableTextElement) {
  return element.type === "text" ? element.textAlign : "left";
}

export function getTextColor(element: EditableTextElement) {
  return element.type === "callout" ? "#f8fafc" : element.style.strokeColor;
}

