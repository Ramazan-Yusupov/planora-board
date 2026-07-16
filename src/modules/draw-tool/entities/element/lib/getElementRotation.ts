import type { BoardElement } from "../model/types";

/** Rotation is stored in radians and intentionally is not normalized. */
export function getElementRotation(element: BoardElement) {
  if (element.type === "arrow") {
    return 0;
  }

  return element.angle ?? 0;
}

