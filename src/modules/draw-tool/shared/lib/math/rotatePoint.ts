import type { Point } from "@/modules/draw-tool/shared/types";

/** Rotates a world point around a world-space centre. */
export function rotatePoint(point: Point, center: Point, angle: number): Point {
  if (angle === 0) {
    return { ...point };
  }

  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const offsetX = point.x - center.x;
  const offsetY = point.y - center.y;

  return {
    x: center.x + offsetX * cosine - offsetY * sine,
    y: center.y + offsetX * sine + offsetY * cosine,
  };
}

