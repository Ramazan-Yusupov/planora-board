import { drawRoundedRectPath } from "./drawRoundedRectPath";
import type { MarkdownElement } from "../model/types";

function getLineKind(line: string) {
  const trimmed = line.trim();

  if (trimmed.startsWith("## ")) return "h2";
  if (trimmed.startsWith("# ")) return "h1";
  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return "bullet";
  if (trimmed.startsWith("`") || trimmed.startsWith("```")) return "code";
  return "text";
}

function stripMarkdown(line: string) {
  return line
    .replace(/^#{1,2}\s+/, "")
    .replace(/^[-*]\s+/, "• ")
    .replace(/^`{1,3}/, "")
    .replace(/`{1,3}$/, "");
}

export function renderMarkdown(
  context: CanvasRenderingContext2D,
  element: MarkdownElement,
) {
  const { style } = element;
  const x = Math.min(element.x, element.x + element.width);
  const y = Math.min(element.y, element.y + element.height);
  const width = Math.abs(element.width);
  const height = Math.abs(element.height);
  const radius = style.cornerStyle === "rounded" ? 14 : 0;
  const headerHeight = 34;
  const padding = 14;

  context.save();
  context.globalAlpha = style.opacity;
  drawRoundedRectPath(context, x, y, width, height, radius);
  context.fillStyle =
    style.fillStyle === "solid" ? style.backgroundColor : "transparent";
  context.fill();
  context.strokeStyle = style.strokeColor;
  context.lineWidth = style.strokeWidth;
  context.stroke();

  context.fillStyle = "rgb(30 41 59 / 82%)";
  drawRoundedRectPath(context, x, y, width, headerHeight, radius);
  context.fill();

  context.fillStyle = "#f8fafc";
  context.font = "700 14px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "middle";
  context.fillText(element.title, x + padding, y + headerHeight / 2);

  let cursorY = y + headerHeight + padding;
  const maxTextWidth = Math.max(24, width - padding * 2);
  const lines = element.content.split("\n");

  lines.forEach((line) => {
    if (cursorY > y + height - padding) return;

    const kind = getLineKind(line);
    const text = stripMarkdown(line) || " ";
    const fontSize =
      kind === "h1" ? element.fontSize + 5 : kind === "h2" ? element.fontSize + 2 : element.fontSize;

    context.font =
      kind === "code"
        ? `${fontSize}px "Cascadia Code", Consolas, monospace`
        : `${kind === "text" || kind === "bullet" ? "500" : "750"} ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;

    if (kind === "code") {
      const metrics = context.measureText(text);
      context.fillStyle = "rgb(15 23 42 / 88%)";
      context.fillRect(
        x + padding - 4,
        cursorY - fontSize,
        Math.min(metrics.width + 10, maxTextWidth),
        fontSize + 8,
      );
    }

    context.fillStyle = kind === "text" ? "#cbd5e1" : style.strokeColor;
    context.fillText(text, x + padding, cursorY, maxTextWidth);
    cursorY += Math.round(fontSize * 1.45);
  });

  context.restore();
}

