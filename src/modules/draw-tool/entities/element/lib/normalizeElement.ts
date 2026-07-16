import type { BoardElement } from "../model/types";

export function normalizeElement<T extends BoardElement>(element: T): T {
  const x = element.width < 0 ? element.x + element.width : element.x;
  const y = element.height < 0 ? element.y + element.height : element.y;

  return {
    ...element,
    x,
    y,
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };
}

