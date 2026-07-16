import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import { getElementBounds } from "../lib/getElementBounds";
import type { DiamondElement } from "../model/types";

export function renderDiamond(
  context: CanvasRenderingContext2D,
  element: DiamondElement,
) {
  const bounds = getElementBounds(element);
  const { style } = element;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  context.save();
  context.globalAlpha = style.opacity;
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  context.beginPath();
  context.moveTo(centerX, bounds.y);
  context.lineTo(bounds.x + bounds.width, centerY);
  context.lineTo(centerX, bounds.y + bounds.height);
  context.lineTo(bounds.x, centerY);
  context.closePath();

  if (style.fillStyle === "solid" && style.backgroundColor !== "transparent") {
    context.fillStyle = style.backgroundColor;
    context.fill();
  }

  context.stroke();
  context.restore();
}

