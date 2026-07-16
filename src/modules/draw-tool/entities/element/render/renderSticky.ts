import { getElementBounds } from "../lib/getElementBounds";
import { TEXT_ELEMENT_PADDING, TEXT_LINE_HEIGHT_RATIO } from "../lib/getTextSize";
import type { StickyElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

export function renderSticky(context: CanvasRenderingContext2D, element: StickyElement) {
  const bounds = getElementBounds(element);
  const fold = Math.min(24, bounds.width * 0.18, bounds.height * 0.18);
  const { style } = element;

  context.save();
  context.globalAlpha = style.opacity;
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.fillStyle = style.backgroundColor === "transparent" ? "#fde68a" : style.backgroundColor;
  drawRoundedRectPath(context, bounds.x, bounds.y, bounds.width, bounds.height, 12);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(bounds.x + bounds.width - fold, bounds.y);
  context.lineTo(bounds.x + bounds.width - fold, bounds.y + fold);
  context.lineTo(bounds.x + bounds.width, bounds.y + fold);
  context.stroke();

  context.fillStyle = style.strokeColor;
  context.font = `${element.fontSize}px ${element.fontFamily}`;
  context.textBaseline = "top";
  const lineHeight = Math.round(element.fontSize * TEXT_LINE_HEIGHT_RATIO);
  const maxWidth = Math.max(1, bounds.width - TEXT_ELEMENT_PADDING * 2);
  element.text.split("\n").forEach((line, index) => {
    context.fillText(line || " ", bounds.x + TEXT_ELEMENT_PADDING, bounds.y + TEXT_ELEMENT_PADDING + index * lineHeight, maxWidth);
  });
  context.restore();
}

