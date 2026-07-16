import type { AdvancedElement } from "../model/types";
import { drawRoundedRectPath } from "./drawRoundedRectPath";
import { renderAdvancedContent } from "./renderAdvancedContent";

function getAdvancedElementBounds(element: AdvancedElement) {
  const x = Math.min(element.x, element.x + element.width);
  const y = Math.min(element.y, element.y + element.height);

  return {
    x,
    y,
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };
}

function drawPanel(
  context: CanvasRenderingContext2D,
  element: AdvancedElement,
) {
  const bounds = getAdvancedElementBounds(element);
  context.globalAlpha = element.style.opacity;
  context.lineWidth = element.style.strokeWidth;
  context.strokeStyle = element.style.strokeColor;
  context.fillStyle =
    element.style.fillStyle === "solid"
      ? element.style.backgroundColor
      : "transparent";
  drawRoundedRectPath(
    context,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    12,
  );
  context.fill();
  context.stroke();
  return bounds;
}

export function renderAdvanced(
  context: CanvasRenderingContext2D,
  element: AdvancedElement,
) {
  renderAdvancedContent(context, element, drawPanel(context, element));
}

