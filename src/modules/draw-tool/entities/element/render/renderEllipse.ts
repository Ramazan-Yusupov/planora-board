import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import { getElementBounds } from "../lib/getElementBounds";
import type { EllipseElement } from "../model/types";

export function renderEllipse(
  context: CanvasRenderingContext2D,
  element: EllipseElement,
) {
  const bounds = getElementBounds(element);
  const { style } = element;

  context.save();
  context.globalAlpha = style.opacity;
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  context.beginPath();
  context.ellipse(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
    bounds.width / 2,
    bounds.height / 2,
    0,
    0,
    Math.PI * 2,
  );

  if (style.fillStyle === "solid" && style.backgroundColor !== "transparent") {
    context.fillStyle = style.backgroundColor;
    context.fill();
  }

  context.stroke();
  context.restore();
}

