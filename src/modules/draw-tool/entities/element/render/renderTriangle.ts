import { getElementBounds } from "../lib/getElementBounds";
import type { TriangleElement } from "../model/types";
import { renderShapePath } from "./renderShapePath";

export function renderTriangle(
  context: CanvasRenderingContext2D,
  element: TriangleElement,
) {
  const bounds = getElementBounds(element);

  renderShapePath(context, element, () => {
    context.moveTo(bounds.x + bounds.width / 2, bounds.y);
    context.lineTo(bounds.x + bounds.width, bounds.y + bounds.height);
    context.lineTo(bounds.x, bounds.y + bounds.height);
    context.closePath();
  });
}

