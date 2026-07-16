import { getElementBounds } from "../lib/getElementBounds";
import type { CloudElement } from "../model/types";
import { renderShapePath } from "./renderShapePath";

export function renderCloud(
  context: CanvasRenderingContext2D,
  element: CloudElement,
) {
  const bounds = getElementBounds(element);
  const { x, y, width, height } = bounds;

  renderShapePath(context, element, () => {
    context.moveTo(x + width * 0.2, y + height * 0.8);
    context.bezierCurveTo(
      x + width * 0.05,
      y + height * 0.8,
      x,
      y + height * 0.65,
      x,
      y + height * 0.5,
    );
    context.bezierCurveTo(
      x,
      y + height * 0.3,
      x + width * 0.16,
      y + height * 0.16,
      x + width * 0.35,
      y + height * 0.22,
    );
    context.bezierCurveTo(
      x + width * 0.47,
      y,
      x + width * 0.79,
      y + height * 0.02,
      x + width * 0.82,
      y + height * 0.29,
    );
    context.bezierCurveTo(
      x + width,
      y + height * 0.3,
      x + width,
      y + height * 0.78,
      x + width * 0.76,
      y + height * 0.8,
    );
    context.closePath();
  });
}

