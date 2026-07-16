import type { Viewport } from "@/modules/draw-tool/entities/viewport";
import { lassoStore } from "../model/lassoStore";

export function renderLasso(context: CanvasRenderingContext2D, viewport: Viewport) {
  const { points } = lassoStore.get();
  if (points.length < 2) {
    return;
  }

  context.save();
  context.translate(-viewport.x * viewport.zoom, -viewport.y * viewport.zoom);
  context.scale(viewport.zoom, viewport.zoom);
  context.lineWidth = 1.5 / viewport.zoom;
  context.strokeStyle = "#818cf8";
  context.fillStyle = "rgb(129 140 248 / 12%)";
  context.setLineDash([5 / viewport.zoom, 4 / viewport.zoom]);
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

