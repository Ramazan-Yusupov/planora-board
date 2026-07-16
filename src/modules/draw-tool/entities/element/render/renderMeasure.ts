import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import type { MeasureElement } from "../model/types";

function formatNumber(value: number) {
  return Number(value.toFixed(value >= 100 ? 0 : 1));
}

export function renderMeasure(context: CanvasRenderingContext2D, element: MeasureElement) {
  const start = { x: element.x, y: element.y };
  const end = { x: element.x + element.width, y: element.y + element.height };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
  const label = `${formatNumber(distance)} px · ${formatNumber(Math.abs(dx))} × ${formatNumber(Math.abs(dy))} · ${angle}°`;
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  context.save();
  context.globalAlpha = element.style.opacity;
  context.lineWidth = Math.max(1.5, element.style.strokeWidth);
  context.strokeStyle = element.style.strokeColor;
  context.fillStyle = element.style.strokeColor;
  context.setLineDash(getLineDash(element.style.strokeStyle, element.style.strokeWidth));
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.setLineDash([]);

  const lineAngle = Math.atan2(dy, dx);
  const normal = { x: -Math.sin(lineAngle), y: Math.cos(lineAngle) };
  [start, end].forEach((point) => {
    context.beginPath();
    context.moveTo(point.x - normal.x * 6, point.y - normal.y * 6);
    context.lineTo(point.x + normal.x * 6, point.y + normal.y * 6);
    context.stroke();
  });

  context.font = '12px Inter, "Segoe UI", sans-serif';
  context.textBaseline = "bottom";
  const metrics = context.measureText(label);
  const paddingX = 6;
  const labelX = mid.x - metrics.width / 2 - paddingX;
  const labelY = mid.y - 12 - 4;
  context.fillStyle = "rgba(15, 23, 42, 0.9)";
  context.fillRect(labelX, labelY - 16, metrics.width + paddingX * 2, 20);
  context.fillStyle = "#e0f2fe";
  context.fillText(label, mid.x - metrics.width / 2, labelY);
  context.restore();
}

