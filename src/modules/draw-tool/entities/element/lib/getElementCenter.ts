import type { Point } from "@/modules/draw-tool/shared/types";
import type { BoardElement } from "../model/types";
import { getElementBounds } from "./getElementBounds";

/**
 * The centre is calculated in the element's local, unrotated coordinate space.
 * It remains stable while the element is rotated around it.
 */
export function getElementCenter(element: BoardElement): Point {
  const bounds = getElementBounds(element);

  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

