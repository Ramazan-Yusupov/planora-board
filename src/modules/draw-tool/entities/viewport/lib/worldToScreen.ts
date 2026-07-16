import type { Point } from "@/modules/draw-tool/shared/types";
import type { Viewport } from "../model/types";

export function worldToScreen(worldPoint: Point, viewport: Viewport): Point {
  return {
    x: (worldPoint.x - viewport.x) * viewport.zoom,
    y: (worldPoint.y - viewport.y) * viewport.zoom,
  };
}

