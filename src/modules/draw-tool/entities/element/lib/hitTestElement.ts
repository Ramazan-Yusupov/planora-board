import type { Point } from "@/modules/draw-tool/shared/types";
import { distance, isPointInRect, rotatePoint } from "@/modules/draw-tool/shared/lib";
import { getArrowPathPoints } from "./getArrowPathPoints";
import { getElementBounds } from "./getElementBounds";
import { getElementCenter } from "./getElementCenter";
import { getElementRotation } from "./getElementRotation";
import type { BoardElement } from "../model/types";

const HIT_PADDING = 9;

function distanceToSegment(point: Point, start: Point, end: Point) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;

  if (lengthSquared === 0) {
    return distance(point, start);
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) /
        lengthSquared,
    ),
  );

  const closestX = start.x + projection * deltaX;
  const closestY = start.y + projection * deltaY;

  return distance(point, { x: closestX, y: closestY });
}

function isPointNearPath(point: Point, points: Point[], tolerance: number) {
  return points.some((start, index) => {
    const end = points[index + 1];
    return end ? distanceToSegment(point, start, end) <= tolerance : false;
  });
}

/** Converts a world point to the element's unrotated local canvas position. */
function toLocalPoint(element: BoardElement, point: Point) {
  const angle = getElementRotation(element);

  return angle === 0
    ? point
    : rotatePoint(point, getElementCenter(element), -angle);
}

export function hitTestElement(element: BoardElement, point: Point) {
  const localPoint = toLocalPoint(element, point);
  const tolerance = Math.max(HIT_PADDING, element.style.strokeWidth + 5);

  if (element.type === "line" || element.type === "measure") {
    return (
      distanceToSegment(
        localPoint,
        { x: element.x, y: element.y },
        { x: element.x + element.width, y: element.y + element.height },
      ) <= tolerance
    );
  }

  if (element.type === "arrow") {
    return isPointNearPath(localPoint, getArrowPathPoints(element), tolerance);
  }

  if (element.type === "freedraw" || element.type === "highlighter") {
    return element.points.length <= 1
      ? distance(localPoint, { x: element.x, y: element.y }) <= tolerance
      : isPointNearPath(localPoint, element.points, tolerance);
  }

  const bounds = getElementBounds(element);

  if (element.type === "ellipse") {
    const radiusX = Math.max(bounds.width / 2, 1);
    const radiusY = Math.max(bounds.height / 2, 1);
    const normalizedX = (localPoint.x - (bounds.x + radiusX)) / radiusX;
    const normalizedY = (localPoint.y - (bounds.y + radiusY)) / radiusY;

    return normalizedX * normalizedX + normalizedY * normalizedY <= 1.18;
  }

  if (element.type === "diamond") {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const normalizedX = Math.abs(localPoint.x - centerX) / Math.max(bounds.width / 2, 1);
    const normalizedY = Math.abs(localPoint.y - centerY) / Math.max(bounds.height / 2, 1);

    return normalizedX + normalizedY <= 1.15;
  }

  return isPointInRect(localPoint, {
    x: bounds.x - tolerance,
    y: bounds.y - tolerance,
    width: bounds.width + tolerance * 2,
    height: bounds.height + tolerance * 2,
  });
}

