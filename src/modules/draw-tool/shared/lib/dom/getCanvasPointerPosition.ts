import type { Point } from "@/modules/draw-tool/shared/types";

type ClientPointer = Pick<MouseEvent, "clientX" | "clientY">;

export function getCanvasPointerPosition(
  event: ClientPointer,
  canvas: HTMLCanvasElement,
): Point {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

