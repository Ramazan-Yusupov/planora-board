import type { Point } from "@/modules/draw-tool/shared/types";

export function snapPointToGrid(point: Point, step: number): Point {
  return {
    x: Math.round(point.x / step) * step,
    y: Math.round(point.y / step) * step,
  };
}

