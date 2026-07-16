import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import type { FreeDrawElement, HighlighterElement } from "../model/types";

export function renderFreeDraw(
  context: CanvasRenderingContext2D,
  element: FreeDrawElement | HighlighterElement,
) {
  const [firstPoint, ...remainingPoints] = element.points;

  if (!firstPoint) {
    return;
  }

  const { style } = element;
  context.save();
  context.globalAlpha = style.opacity;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);
  remainingPoints.forEach((point) => context.lineTo(point.x, point.y));

  if (remainingPoints.length === 0) {
    context.arc(firstPoint.x, firstPoint.y, style.strokeWidth / 2, 0, Math.PI * 2);
    context.fillStyle = style.strokeColor;
    context.fill();
  } else {
    context.stroke();
  }

  context.restore();
}

