import { CANVAS_CONFIG } from "@/modules/draw-tool/shared/config";
import type { Viewport } from "./types";

export function createViewport(overrides: Partial<Viewport> = {}): Viewport {
  return {
    x: 0,
    y: 0,
    zoom: CANVAS_CONFIG.defaultZoom,
    ...overrides,
  };
}

