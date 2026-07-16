import { getElementBounds } from "../lib/getElementBounds";
import { TEXT_ELEMENT_PADDING, TEXT_LINE_HEIGHT_RATIO } from "../lib/getTextSize";
import type { TextElement } from "../model/types";

export function renderText(
  context: CanvasRenderingContext2D,
  element: TextElement,
) {
  const { style } = element;
  const bounds = getElementBounds(element);
  const lineHeight = Math.round(element.fontSize * TEXT_LINE_HEIGHT_RATIO);
  const lines = element.text.split("\n");
  const contentHeight = lines.length * lineHeight;
  const firstLineCenterY =
    bounds.y + (bounds.height - contentHeight) / 2 + lineHeight / 2;
  const contentLeft = bounds.x + TEXT_ELEMENT_PADDING;
  const contentRight = bounds.x + bounds.width - TEXT_ELEMENT_PADDING;

  context.save();
  context.globalAlpha = style.opacity;
  context.fillStyle = style.strokeColor;
  context.font = `${element.fontSize}px ${element.fontFamily}`;
  context.textBaseline = "middle";
  context.textAlign = element.textAlign;

  const anchorX =
    element.textAlign === "center"
      ? (contentLeft + contentRight) / 2
      : element.textAlign === "right"
        ? contentRight
        : contentLeft;

  lines.forEach((line, index) => {
    context.fillText(
      line || " ",
      anchorX,
      firstLineCenterY + index * lineHeight,
    );
  });

  context.restore();
}

