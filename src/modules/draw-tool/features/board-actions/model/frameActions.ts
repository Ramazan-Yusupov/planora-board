import { getElementBounds } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

export function getFrameExportElements(
  frame: BoardElement,
  elements: BoardElement[],
) {
  const frameBounds = getElementBounds(frame);
  return elements.filter((element) => {
    if (element.id === frame.id) return true;
    const bounds = getElementBounds(element);
    return (
      bounds.x >= frameBounds.x &&
      bounds.y >= frameBounds.y &&
      bounds.x + bounds.width <= frameBounds.x + frameBounds.width &&
      bounds.y + bounds.height <= frameBounds.y + frameBounds.height
    );
  });
}

export function getSelectedFrame(elements: BoardElement[]) {
  return elements.find((element) => element.type === "frame") ?? null;
}

export function getFrameSummaries(elements: BoardElement[]) {
  return elements
    .filter((element) => element.type === "frame")
    .map((element) => ({
      id: element.id,
      name: element.name,
    }));
}

