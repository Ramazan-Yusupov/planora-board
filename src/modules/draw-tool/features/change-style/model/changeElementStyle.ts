import { updateElement } from "@/modules/draw-tool/entities/element";
import type { BoardElement, ElementStyle } from "@/modules/draw-tool/entities/element";

/** Returns an updated element without mutating its style object. */
export function changeElementStyle(
  element: BoardElement,
  patch: Partial<ElementStyle>,
) {
  return updateElement(element, { style: { ...element.style, ...patch } });
}

