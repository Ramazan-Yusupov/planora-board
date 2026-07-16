import { updateElement } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import type { Point } from "@/modules/draw-tool/shared/types";

export function moveElementByDelta(element: BoardElement, delta: Point) {
  if (element.type === "freedraw" || element.type === "highlighter") {
    return updateElement(element, {
      x: element.x + delta.x,
      y: element.y + delta.y,
      points: element.points.map((point) => ({
        x: point.x + delta.x,
        y: point.y + delta.y,
      })),
    });
  }

  if (element.type === "arrow" && element.waypoints?.length) {
    return updateElement(element, {
      x: element.x + delta.x,
      y: element.y + delta.y,
      waypoints: element.waypoints.map((point) => ({
        x: point.x + delta.x,
        y: point.y + delta.y,
      })),
    });
  }

  return updateElement(element, {
    x: element.x + delta.x,
    y: element.y + delta.y,
  });
}

export function moveElements(elementIds: string[], delta: Point) {
  const selectedIds = new Set(elementIds);

  sceneStore.updateAll((element) =>
    selectedIds.has(element.id) ? moveElementByDelta(element, delta) : element,
  );
}

