import { getElementBounds } from "../lib/getElementBounds";
import type { HexagonElement } from "../model/types";
import { renderShapePath } from "./renderShapePath";

export function renderHexagon(
  context: CanvasRenderingContext2D,
  element: HexagonElement,
) {
  const bounds = getElementBounds(element);
  const quarterWidth = bounds.width * 0.25;
  const halfHeight = bounds.height / 2;

  renderShapePath(context, element, () => {
    context.moveTo(bounds.x + quarterWidth, bounds.y);
    context.lineTo(bounds.x + bounds.width - quarterWidth, bounds.y);
    context.lineTo(bounds.x + bounds.width, bounds.y + halfHeight);
    context.lineTo(bounds.x + bounds.width - quarterWidth, bounds.y + bounds.height);
    context.lineTo(bounds.x + quarterWidth, bounds.y + bounds.height);
    context.lineTo(bounds.x, bounds.y + halfHeight);
    context.closePath();
  });
}

