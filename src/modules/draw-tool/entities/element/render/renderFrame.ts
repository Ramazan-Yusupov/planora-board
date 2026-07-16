import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import { getElementBounds } from "../lib/getElementBounds";
import type { FrameElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

export function renderFrame(
  context: CanvasRenderingContext2D,
  element: FrameElement,
) {
  const bounds = getElementBounds(element);
  const { style } = element;

  context.save();
  context.globalAlpha = style.opacity;
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  drawRoundedRectPath(context, bounds.x, bounds.y, bounds.width, bounds.height, 12);
  context.stroke();

  context.setLineDash([]);
  context.fillStyle = style.strokeColor;
  context.font = "13px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "bottom";
  context.fillText(element.name || "Frame", bounds.x, bounds.y - 7);
  context.restore();
}

