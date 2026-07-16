import { createId } from "@/modules/draw-tool/shared/lib";
import type { BoardElement } from "./types";

type CloneElementOptions = {
  offset?: { x: number; y: number };
  regenerateId?: boolean;
};

/** Creates an independent element copy for duplicate, clipboard and template flows. */
export function cloneElement(
  element: BoardElement,
  { offset = { x: 0, y: 0 }, regenerateId = true }: CloneElementOptions = {},
): BoardElement {
  const copy = JSON.parse(JSON.stringify(element)) as BoardElement;
  const now = Date.now();

  copy.id = regenerateId ? createId(element.type) : element.id;
  copy.createdAt = now;
  copy.updatedAt = now;
  copy.x += offset.x;
  copy.y += offset.y;
  copy.style = { ...copy.style };

  if (copy.type === "freedraw" || copy.type === "highlighter") {
    copy.points = copy.points.map((point) => ({
      x: point.x + offset.x,
      y: point.y + offset.y,
    }));
  }

  if (copy.type === "arrow" && copy.waypoints?.length) {
    copy.waypoints = copy.waypoints.map((point) => ({
      x: point.x + offset.x,
      y: point.y + offset.y,
    }));
  }

  return copy;
}

