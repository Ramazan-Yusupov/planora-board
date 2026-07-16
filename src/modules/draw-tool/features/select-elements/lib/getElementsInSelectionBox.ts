import { getElementBounds } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { Rect } from "@/modules/draw-tool/shared/types";

export function getElementsInSelectionBox(
  elements: BoardElement[],
  selectionBox: Rect,
) {
  return elements.filter((element) => {
    if (element.locked) {
      return false;
    }

    const bounds = getElementBounds(element);

    return (
      bounds.x >= selectionBox.x &&
      bounds.y >= selectionBox.y &&
      bounds.x + bounds.width <= selectionBox.x + selectionBox.width &&
      bounds.y + bounds.height <= selectionBox.y + selectionBox.height
    );
  });
}

