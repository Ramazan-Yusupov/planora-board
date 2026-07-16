import { getElementBounds } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

export function getViewportForElement(
  element: BoardElement,
  currentZoom: number,
) {
  const bounds = getElementBounds(element);
  return {
    x: bounds.x + bounds.width / 2 - window.innerWidth / 2 / currentZoom,
    y: bounds.y + bounds.height / 2 - window.innerHeight / 2 / currentZoom,
    zoom: currentZoom,
  };
}

export function getViewportForFrame(frame: BoardElement) {
  const bounds = getElementBounds(frame);
  const zoom = Math.max(
    0.2,
    Math.min(
      2,
      Math.min(
        window.innerWidth / (bounds.width + 160),
        window.innerHeight / (bounds.height + 160),
      ),
    ),
  );

  return {
    x: bounds.x + bounds.width / 2 - window.innerWidth / 2 / zoom,
    y: bounds.y + bounds.height / 2 - window.innerHeight / 2 / zoom,
    zoom,
  };
}

