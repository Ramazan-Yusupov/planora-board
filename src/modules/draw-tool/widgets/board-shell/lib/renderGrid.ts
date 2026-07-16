import type { Viewport } from "@/modules/draw-tool/entities/viewport";
import { CANVAS_CONFIG } from "@/modules/draw-tool/shared/config";
import type { CanvasSize } from "@/modules/draw-tool/shared/lib/canvas/resizeCanvas";

type RenderGridParams = {
  context: CanvasRenderingContext2D;
  viewport: Viewport;
  size: CanvasSize;
};

function getDotStep(zoom: number) {
  const minPixelDistance = 14;
  const baseStep = CANVAS_CONFIG.gridSize;
  const multiplier = Math.max(
    1,
    Math.ceil(minPixelDistance / (baseStep * zoom)),
  );

  return baseStep * multiplier;
}

function getOffset(position: number, step: number) {
  return -((position % step) + step) % step;
}

export function renderGrid({ context, viewport, size }: RenderGridParams) {
  const worldStep = getDotStep(viewport.zoom);
  const screenStep = worldStep * viewport.zoom;
  const startX = getOffset(viewport.x * viewport.zoom, screenStep);
  const startY = getOffset(viewport.y * viewport.zoom, screenStep);
  const dotRadius = Math.min(1.35, Math.max(0.65, viewport.zoom * 0.85));

  context.save();
  context.fillStyle = "rgb(148 163 184 / 28%)";
  context.beginPath();

  for (let x = startX; x <= size.width + screenStep; x += screenStep) {
    for (let y = startY; y <= size.height + screenStep; y += screenStep) {
      context.moveTo(x + dotRadius, y);
      context.arc(x, y, dotRadius, 0, Math.PI * 2);
    }
  }

  context.fill();
  context.restore();
}

