import { normalizeElement, updateElement } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { Point } from "@/modules/draw-tool/shared/types";

/** Applies drag end coordinates to a shape model and normalizes closed shapes. */
export function drawShape(element: BoardElement, startPoint: Point, endPoint: Point) {
  const drawn = updateElement(element, {
    x: startPoint.x,
    y: startPoint.y,
    width: endPoint.x - startPoint.x,
    height: endPoint.y - startPoint.y,
  });

  return drawn.type === "line" || drawn.type === "arrow" || drawn.type === "measure"
    ? drawn
    : normalizeElement(drawn);
}

