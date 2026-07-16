import { getElementBounds } from "../lib/getElementBounds";
import type { TableElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";

export function renderTable(context: CanvasRenderingContext2D, element: TableElement) {
  const bounds = getElementBounds(element);
  const { rows, columns, style } = element;
  const cellWidth = bounds.width / Math.max(columns, 1);
  const cellHeight = bounds.height / Math.max(rows, 1);

  context.save();
  context.globalAlpha = style.opacity;
  context.fillStyle = style.backgroundColor === "transparent" ? "#0f172a" : style.backgroundColor;
  context.strokeStyle = style.strokeColor;
  context.lineWidth = style.strokeWidth;
  drawRoundedRectPath(context, bounds.x, bounds.y, bounds.width, bounds.height, style.cornerStyle === "rounded" ? 10 : 0);
  context.fill();
  context.stroke();

  for (let column = 1; column < columns; column += 1) {
    context.beginPath();
    context.moveTo(bounds.x + column * cellWidth, bounds.y);
    context.lineTo(bounds.x + column * cellWidth, bounds.y + bounds.height);
    context.stroke();
  }
  for (let row = 1; row < rows; row += 1) {
    context.beginPath();
    context.moveTo(bounds.x, bounds.y + row * cellHeight);
    context.lineTo(bounds.x + bounds.width, bounds.y + row * cellHeight);
    context.stroke();
  }

  context.font = `${element.fontSize}px Inter, "Segoe UI", sans-serif`;
  context.textBaseline = "middle";
  context.fillStyle = "#e2e8f0";
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const text = element.cells[index] ?? "";
      const x = bounds.x + column * cellWidth + 8;
      const y = bounds.y + row * cellHeight + cellHeight / 2;
      const truncated = text.length > 22 ? `${text.slice(0, 21)}…` : text;
      context.fillText(truncated, x, y, Math.max(0, cellWidth - 14));
    }
  }
  context.restore();
}

