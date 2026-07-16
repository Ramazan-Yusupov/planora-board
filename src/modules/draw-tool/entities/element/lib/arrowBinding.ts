import type { Point } from "@/modules/draw-tool/shared/types";
import { getElementBounds } from "./getElementBounds";
import { getElementCenter } from "./getElementCenter";
import { getRelationAnchor } from "./getRelationAnchor";
import type { BoardElement, ElementBinding } from "../model/types";

const NON_BINDABLE_TYPES = new Set<BoardElement["type"]>([
  "arrow",
  "line",
  "measure",
  "freedraw",
  "highlighter",
]);

function distanceToRect(point: Point, element: BoardElement) {
  const bounds = getElementBounds(element);
  const closestX = Math.max(bounds.x, Math.min(point.x, bounds.x + bounds.width));
  const closestY = Math.max(bounds.y, Math.min(point.y, bounds.y + bounds.height));

  return Math.hypot(point.x - closestX, point.y - closestY);
}

/** Connector targets deliberately exclude other connector strokes. */
export function isArrowBindingTarget(element: BoardElement) {
  return !NON_BINDABLE_TYPES.has(element.type);
}

/**
 * Finds the nearest topmost connectable element inside the magnetic radius.
 * The reverse traversal retains the board's visible stacking precedence.
 */
export function findArrowBindingTarget(
  elements: BoardElement[],
  point: Point,
  excludedElementId: string | undefined,
  radius: number,
) {
  let nearestElement: BoardElement | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let nearestIndex = -1;

  for (const [index, element] of elements.entries()) {
    if (element.id === excludedElementId || !isArrowBindingTarget(element)) {
      continue;
    }

    const distance = distanceToRect(point, element);

    if (distance > radius) {
      continue;
    }

    if (
      distance < nearestDistance - 0.001 ||
      (Math.abs(distance - nearestDistance) < 0.001 && index > nearestIndex)
    ) {
      nearestElement = element;
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestElement;
}

/** Creates a persistent binding that keeps the selected target side stable. */
export function createArrowBinding(
  target: BoardElement,
  point: Point,
): ElementBinding {
  const center = getElementCenter(target);

  return {
    elementId: target.id,
    focus: Math.atan2(point.y - center.y, point.x - center.x),
    anchor: "fixed",
  };
}

/** Resolves a binding to the point on the target outline used by an arrow. */
export function getArrowBindingAnchor(
  target: BoardElement,
  binding: ElementBinding,
  toward: Point,
) {
  if (binding.anchor === "fixed") {
    const center = getElementCenter(target);
    const bounds = getElementBounds(target);
    const rayLength = Math.max(bounds.width, bounds.height, 1) * 2;
    const fixedDirection = {
      x: center.x + Math.cos(binding.focus) * rayLength,
      y: center.y + Math.sin(binding.focus) * rayLength,
    };

    return getRelationAnchor(target, fixedDirection);
  }

  return getRelationAnchor(target, toward);
}

