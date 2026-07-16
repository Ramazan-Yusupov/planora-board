import type { Point } from "@/modules/draw-tool/shared/types";
import type { Viewport } from "../model/types";
import { clampZoom } from "./clampZoom";
import { screenToWorld } from "./screenToWorld";

export function zoomAtPoint(
  viewport: Viewport,
  screenPoint: Point,
  nextZoomValue: number,
): Viewport {
  const nextZoom = clampZoom(nextZoomValue);
  const worldPoint = screenToWorld(screenPoint, viewport);

  return {
    zoom: nextZoom,
    x: worldPoint.x - screenPoint.x / nextZoom,
    y: worldPoint.y - screenPoint.y / nextZoom,
  };
}

