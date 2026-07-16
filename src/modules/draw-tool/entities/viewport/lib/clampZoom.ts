import { CANVAS_CONFIG } from "@/modules/draw-tool/shared/config";
import { clamp } from "@/modules/draw-tool/shared/lib/math/clamp";

export function clampZoom(zoom: number) {
  return clamp(zoom, CANVAS_CONFIG.minZoom, CANVAS_CONFIG.maxZoom);
}

