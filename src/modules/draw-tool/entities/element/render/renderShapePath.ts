import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import type { BaseElement } from "../model/types";

export function renderShapePath(
  context: CanvasRenderingContext2D,
  element: BaseElement,
  drawPath: () => void,
) {
  const { style } = element;

  context.save();
  context.globalAlpha = style.opacity;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  context.beginPath();
  drawPath();

  if (style.fillStyle === "solid" && style.backgroundColor !== "transparent") {
    context.fillStyle = style.backgroundColor;
    context.fill();
  }

  context.stroke();
  context.restore();
}

