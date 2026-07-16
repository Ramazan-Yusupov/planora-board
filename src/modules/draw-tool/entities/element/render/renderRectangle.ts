import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import { getElementBounds } from "../lib/getElementBounds";
import type { RectangleElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

export function renderRectangle(
  context: CanvasRenderingContext2D,
  element: RectangleElement,
) {
  const bounds = getElementBounds(element);
  const { style } = element;

  const radius = style.cornerStyle === "rounded" ? 12 : 0;

  context.save();

  context.globalAlpha = style.opacity;
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  drawRoundedRectPath(
    context,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    radius,
  );

  if (style.fillStyle === "solid" && style.backgroundColor !== "transparent") {
    context.fillStyle = style.backgroundColor;
    context.fill();
  }

  context.stroke();
  context.restore();
}

