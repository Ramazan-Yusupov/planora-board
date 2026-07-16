import type { Rect, Size } from "@/modules/draw-tool/shared/types";
import type { Viewport } from "../model/types";

export function getVisibleBounds(viewport: Viewport, size: Size): Rect {
  return {
    x: viewport.x,
    y: viewport.y,
    width: size.width / viewport.zoom,
    height: size.height / viewport.zoom,
  };
}

