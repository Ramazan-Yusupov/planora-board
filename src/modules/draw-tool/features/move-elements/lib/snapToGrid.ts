import { snapPointToGrid } from "@/modules/draw-tool/shared/lib/math/snapPointToGrid";
import type { Point } from "@/modules/draw-tool/shared/types";

/** Snaps a movement delta to the configured grid increment. */
export function snapToGrid(delta: Point, gridSize: number): Point {
  return snapPointToGrid(delta, gridSize);
}

