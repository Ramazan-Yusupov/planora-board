import type { TextElement } from "../model/types";

export const TEXT_ELEMENT_PADDING = 8;
export const TEXT_LINE_HEIGHT_RATIO = 1.25;

const CHARACTER_WIDTH_RATIO = 0.62;

let measureContext: CanvasRenderingContext2D | null | undefined;

function getMeasureContext() {
  if (measureContext !== undefined) {
    return measureContext;
  }

  if (typeof document === "undefined") {
    measureContext = null;
    return measureContext;
  }

  measureContext = document.createElement("canvas").getContext("2d");
  return measureContext;
}

function measureLineWidth(line: string, fontSize: number, fontFamily: string) {
  const context = getMeasureContext();

  if (!context) {
    return Math.max(fontSize, line.length * fontSize * CHARACTER_WIDTH_RATIO);
  }

  context.font = `${fontSize}px ${fontFamily}`;
  return Math.max(fontSize * 0.45, context.measureText(line || " ").width);
}

export function getTextContentSize(
  text: string,
  fontSize: number,
  fontFamily = '"Segoe Print", "Comic Sans MS", cursive',
): { width: number; height: number } {
  const lines = text.split("\n");
  const lineHeight = Math.ceil(fontSize * TEXT_LINE_HEIGHT_RATIO);
  const width = Math.max(
    fontSize,
    ...lines.map((line) => measureLineWidth(line, fontSize, fontFamily)),
  );

  return {
    width: Math.ceil(width),
    height: Math.max(lineHeight, Math.ceil(lines.length * lineHeight)),
  };
}

export function getTextSize(
  text: string,
  fontSize: number,
  fontFamily = '"Segoe Print", "Comic Sans MS", cursive',
): { width: number; height: number } {
  const content = getTextContentSize(text || " ", fontSize, fontFamily);

  return {
    width: Math.ceil(content.width + TEXT_ELEMENT_PADDING * 2),
    height: Math.ceil(content.height + TEXT_ELEMENT_PADDING * 2),
  };
}

export function getTextElementSize(element: TextElement) {
  return getTextSize(element.text || " ", element.fontSize, element.fontFamily);
}

