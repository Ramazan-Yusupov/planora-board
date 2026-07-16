import type { ToolId } from "@/modules/draw-tool/entities/tool";

export function getBoardCursorClass(activeTool: ToolId, isPanOnly: boolean) {
  if (isPanOnly) {
    return "cursor-grab active:cursor-grabbing";
  }

  if (activeTool === "selection") {
    return "cursor-default";
  }

  if (activeTool === "eraser") {
    return "cursor-cell";
  }

  if (activeTool === "eyedropper") {
    return "cursor-copy";
  }

  return "cursor-crosshair";
}

