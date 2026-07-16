import { getElementBounds } from "../lib/getElementBounds";
import type { StarElement } from "../model/types";
import { renderShapePath } from "./renderShapePath";

const STAR_POINTS = 5;

export function renderStar(
  context: CanvasRenderingContext2D,
  element: StarElement,
) {
  const bounds = getElementBounds(element);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const outerRadiusX = bounds.width / 2;
  const outerRadiusY = bounds.height / 2;
  const innerRatio = 0.42;

  renderShapePath(context, element, () => {
    for (let index = 0; index < STAR_POINTS * 2; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * index) / STAR_POINTS;
      const ratio = index % 2 === 0 ? 1 : innerRatio;
      const x = centerX + Math.cos(angle) * outerRadiusX * ratio;
      const y = centerY + Math.sin(angle) * outerRadiusY * ratio;

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.closePath();
  });
}

