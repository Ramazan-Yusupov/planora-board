import type { Point } from "@/modules/draw-tool/shared/types";
import type { Viewport } from "../model/types";

export function screenToWorld(screenPoint: Point, viewport: Viewport): Point {
  return {
    x: screenPoint.x / viewport.zoom + viewport.x,
    y: screenPoint.y / viewport.zoom + viewport.y,
  };
}

