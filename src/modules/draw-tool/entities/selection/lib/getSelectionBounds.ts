import { getElementBounds } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { Rect } from "@/modules/draw-tool/shared/types";

export function getSelectionBounds(elements: BoardElement[]): Rect | null {
  if (elements.length === 0) {
    return null;
  }

  const bounds = elements.map(getElementBounds);
  const minX = Math.min(...bounds.map((item) => item.x));
  const minY = Math.min(...bounds.map((item) => item.y));
  const maxX = Math.max(...bounds.map((item) => item.x + item.width));
  const maxY = Math.max(...bounds.map((item) => item.y + item.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

