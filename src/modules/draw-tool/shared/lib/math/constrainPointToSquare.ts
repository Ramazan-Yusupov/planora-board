import type { Point } from "@/modules/draw-tool/shared/types";

export function constrainPointToSquare(
  startPoint: Point,
  currentPoint: Point,
  step: number,
): Point {
  const deltaX = currentPoint.x - startPoint.x;
  const deltaY = currentPoint.y - startPoint.y;

  const side = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  const snappedSide = Math.round(side / step) * step;

  const xDirection = deltaX < 0 ? -1 : 1;
  const yDirection = deltaY < 0 ? -1 : 1;

  return {
    x: startPoint.x + snappedSide * xDirection,
    y: startPoint.y + snappedSide * yDirection,
  };
}

