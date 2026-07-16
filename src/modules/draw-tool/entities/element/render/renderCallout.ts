import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import { getElementBounds } from "../lib/getElementBounds";
import { getRelationAnchor } from "../lib/getRelationAnchor";
import { TEXT_ELEMENT_PADDING, TEXT_LINE_HEIGHT_RATIO } from "../lib/getTextSize";
import type { CalloutElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

export function renderCallout(context: CanvasRenderingContext2D, element: CalloutElement) {
  const bounds = getElementBounds(element);
  const { style } = element;
  const target = element.targetPoint;

  context.save();
  context.globalAlpha = style.opacity;
  context.lineWidth = Math.max(1.5, style.strokeWidth);
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  if (target) {
    const start = getRelationAnchor(element, target);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(target.x, target.y);
    context.stroke();
    context.setLineDash([]);
    context.beginPath();
    context.arc(target.x, target.y, 3.5, 0, Math.PI * 2);
    context.fillStyle = style.strokeColor;
    context.fill();
  }

  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));
  context.fillStyle = style.backgroundColor === "transparent" ? "#172554" : style.backgroundColor;
  drawRoundedRectPath(context, bounds.x, bounds.y, bounds.width, bounds.height, 12);
  context.fill();
  context.stroke();

  context.fillStyle = "#f8fafc";
  context.font = `${element.fontSize}px ${element.fontFamily}`;
  context.textBaseline = "top";
  const lineHeight = Math.round(element.fontSize * TEXT_LINE_HEIGHT_RATIO);
  const maxWidth = Math.max(1, bounds.width - TEXT_ELEMENT_PADDING * 2);
  element.text.split("\n").forEach((line, index) => {
    context.fillText(line || " ", bounds.x + TEXT_ELEMENT_PADDING, bounds.y + TEXT_ELEMENT_PADDING + index * lineHeight, maxWidth);
  });
  context.restore();
}

