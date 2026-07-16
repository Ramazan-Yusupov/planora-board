import type { Point } from "@/modules/draw-tool/shared/types";

/** Returns Euclidean distance between two board points. */
export function distance(left: Point, right: Point) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

