import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SelectionState } from "../model/types";

export function getSelectedElements(
  elements: BoardElement[],
  selection: SelectionState,
) {
  const selectedIds = new Set(selection.elementIds);
  return elements.filter((element) => selectedIds.has(element.id));
}

