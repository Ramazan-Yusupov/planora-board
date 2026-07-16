import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import { getElementBounds } from "../lib/getElementBounds";
import type { BadgeElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

const BADGE_HORIZONTAL_PADDING = 24;
const BADGE_VERTICAL_PADDING = 12;

type RenderBadgeOptions = {
  hideLabel?: boolean;
};

function getBadgeFontSize(
  context: CanvasRenderingContext2D,
  label: string,
  width: number,
  height: number,
) {
  const maxFontSize = Math.max(12, height - BADGE_VERTICAL_PADDING * 2);
  const minFontSize = 11;

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    context.font = `700 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    const metrics = context.measureText(label);

    if (metrics.width <= Math.max(8, width - BADGE_HORIZONTAL_PADDING * 2)) {
      return fontSize;
    }
  }

  return minFontSize;
}

export function renderBadge(
  context: CanvasRenderingContext2D,
  element: BadgeElement,
  options: RenderBadgeOptions = {},
) {
  const bounds = getElementBounds(element);
  const { style } = element;
  const label = options.hideLabel ? "" : element.label?.trim() || "Badge";
  const radius = bounds.height / 2;

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
  context.setLineDash([]);
  if (!label) {
    context.restore();
    return;
  }
  context.font = `700 ${getBadgeFontSize(context, label, bounds.width, bounds.height)}px Inter, ui-sans-serif, system-ui, sans-serif`;
  context.fillStyle = style.strokeColor;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 + 0.5);
  context.restore();
}

