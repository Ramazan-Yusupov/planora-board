import type { Point } from "@/modules/draw-tool/shared/types";

export function constrainPointToAngle(
  startPoint: Point,
  currentPoint: Point,
): Point {
  const deltaX = currentPoint.x - startPoint.x;
  const deltaY = currentPoint.y - startPoint.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX >= absY * 2) {
    return { x: currentPoint.x, y: startPoint.y };
  }

  if (absY >= absX * 2) {
    return { x: startPoint.x, y: currentPoint.y };
  }

  const side = Math.max(absX, absY);

  return {
    x: startPoint.x + side * (deltaX < 0 ? -1 : 1),
    y: startPoint.y + side * (deltaY < 0 ? -1 : 1),
  };
}

