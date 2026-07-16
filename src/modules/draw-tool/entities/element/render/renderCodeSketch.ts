import { getElementBounds } from "../lib/getElementBounds";
import type { CodeSketchElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

const HORIZONTAL_PADDING = 14;
const VERTICAL_PADDING = 11;

function wrapLine(line: string, maxCharacters: number) {
  if (maxCharacters <= 1) return [line.slice(0, 1)];
  if (line.length <= maxCharacters) return [line];

  const parts: string[] = [];
  let remaining = line;

  while (remaining.length > maxCharacters) {
    let splitAt = remaining.lastIndexOf(" ", maxCharacters);
    if (splitAt < Math.floor(maxCharacters * 0.55)) splitAt = maxCharacters;
    parts.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  parts.push(remaining);
  return parts;
}

export function renderCodeSketch(
  context: CanvasRenderingContext2D,
  element: CodeSketchElement,
) {
  const bounds = getElementBounds(element);
  const { style } = element;
  const headerHeight = Math.min(34, Math.max(26, bounds.height * 0.18));
  const availableWidth = Math.max(1, bounds.width - HORIZONTAL_PADDING * 2);
  const availableHeight = Math.max(1, bounds.height - headerHeight - VERTICAL_PADDING * 2);
  const fontSize = Math.max(9, Math.min(15, availableWidth / 28, availableHeight / 5));
  const lineHeight = Math.max(13, Math.round(fontSize * 1.48));
  const maxCharacters = Math.max(4, Math.floor(availableWidth / Math.max(fontSize * 0.61, 1)));
  const lines = element.code
    .split("\n")
    .flatMap((line) => wrapLine(line || " ", maxCharacters));
  const visibleLines = lines.slice(0, Math.max(1, Math.floor(availableHeight / lineHeight)));

  context.save();
  context.globalAlpha = style.opacity;
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.fillStyle =
    style.fillStyle === "solid" && style.backgroundColor !== "transparent"
      ? style.backgroundColor
      : "rgb(15 23 42 / 94%)";

  drawRoundedRectPath(context, bounds.x, bounds.y, bounds.width, bounds.height, 11);
  context.fill();
  context.stroke();

  context.save();
  drawRoundedRectPath(context, bounds.x, bounds.y, bounds.width, bounds.height, 11);
  context.clip();

  context.fillStyle = "rgb(71 85 105 / 72%)";
  context.fillRect(bounds.x, bounds.y, bounds.width, headerHeight);
  context.fillStyle = style.strokeColor;
  context.font = `600 ${Math.max(11, Math.min(14, fontSize + 1))}px Inter, ui-sans-serif, system-ui, sans-serif`;
  context.textBaseline = "middle";
  context.fillText(element.title || "Code sketch", bounds.x + HORIZONTAL_PADDING, bounds.y + headerHeight / 2);

  context.fillStyle = "#e2e8f0";
  context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.textBaseline = "top";
  visibleLines.forEach((line, index) => {
    context.fillText(
      line,
      bounds.x + HORIZONTAL_PADDING,
      bounds.y + headerHeight + VERTICAL_PADDING + index * lineHeight,
    );
  });

  context.restore();
  context.restore();
}

