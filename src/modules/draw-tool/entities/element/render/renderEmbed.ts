import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import { getElementBounds } from "../lib/getElementBounds";
import type { EmbedElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

function getHostname(url: string) {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url || "Встроенная страница";
  }
}

export function renderEmbed(
  context: CanvasRenderingContext2D,
  element: EmbedElement,
) {
  const bounds = getElementBounds(element);
  const { style } = element;
  const title = getHostname(element.url);

  context.save();
  context.globalAlpha = style.opacity;
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));
  context.fillStyle =
    style.fillStyle === "solid" && style.backgroundColor !== "transparent"
      ? style.backgroundColor
      : "rgb(15 23 42 / 78%)";

  drawRoundedRectPath(context, bounds.x, bounds.y, bounds.width, bounds.height, 10);
  context.fill();
  context.stroke();

  const headerHeight = Math.min(32, Math.max(24, bounds.height * 0.18));
  context.fillStyle = "rgb(148 163 184 / 22%)";
  context.fillRect(bounds.x, bounds.y, bounds.width, headerHeight);

  context.fillStyle = style.strokeColor;
  context.font = "600 13px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "middle";
  context.fillText(element.title || "Встроенная страница", bounds.x + 12, bounds.y + headerHeight / 2);

  context.fillStyle = "rgb(148 163 184)";
  context.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
  context.fillText(
    title.slice(0, 42),
    bounds.x + 12,
    Math.min(bounds.y + headerHeight + 28, bounds.y + bounds.height - 14),
  );

  context.restore();
}

