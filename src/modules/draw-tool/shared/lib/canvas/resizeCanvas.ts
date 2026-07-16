import { CANVAS_CONFIG } from "@/modules/draw-tool/shared/config";

export type CanvasSize = {
  width: number;
  height: number;
  dpr: number;
};

export function resizeCanvas(canvas: HTMLCanvasElement): CanvasSize {
  const rect = canvas.getBoundingClientRect();

  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  const devicePixelRatio = window.devicePixelRatio || 1;
  const dpr = Math.min(devicePixelRatio, CANVAS_CONFIG.maxDevicePixelRatio);

  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (canvas.width !== pixelWidth) {
    canvas.width = pixelWidth;
  }

  if (canvas.height !== pixelHeight) {
    canvas.height = pixelHeight;
  }

  return { width, height, dpr };
}

