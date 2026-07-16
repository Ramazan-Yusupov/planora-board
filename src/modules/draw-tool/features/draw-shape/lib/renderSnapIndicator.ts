import { worldToScreen } from "@/modules/draw-tool/entities/viewport";
import type { Viewport } from "@/modules/draw-tool/entities/viewport";
import { snapIndicatorStore } from "../model/snapIndicatorStore";

export function renderSnapIndicator(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
) {
  const point = snapIndicatorStore.get();

  if (!point) {
    return;
  }

  const screenPoint = worldToScreen(point, viewport);

  context.save();

  context.strokeStyle = "#2563eb";
  context.fillStyle = "#ffffff";
  context.lineWidth = 1.5;

  context.beginPath();
  context.arc(screenPoint.x, screenPoint.y, 5, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(screenPoint.x - 9, screenPoint.y);
  context.lineTo(screenPoint.x + 9, screenPoint.y);
  context.moveTo(screenPoint.x, screenPoint.y - 9);
  context.lineTo(screenPoint.x, screenPoint.y + 9);
  context.stroke();

  context.restore();
}

