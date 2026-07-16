import type { Point } from "@/modules/draw-tool/shared/types";
import { rotatePoint } from "@/modules/draw-tool/shared/lib";
import { getElementBounds } from "./getElementBounds";
import type { BoardElement } from "../model/types";

const EPSILON = 0.01;

function getCenter(element: BoardElement): Point {
  const bounds = getElementBounds(element);
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}

/**
 * Finds the point where a ray from a target's centre towards another point
 * exits its visual bounds. It works consistently for shapes, text, images and
 * containers and keeps connector endpoints on a useful edge.
 */
export function getRelationAnchor(element: BoardElement, toward: Point): Point {
  const bounds = getElementBounds(element);
  const center = getCenter(element);
  const angle = element.angle ?? 0;
  const localToward = rotatePoint(toward, center, -angle);
  const dx = localToward.x - center.x;
  const dy = localToward.y - center.y;

  if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) {
    return rotatePoint({ x: center.x + bounds.width / 2, y: center.y }, center, angle);
  }

  const halfWidth = Math.max(bounds.width / 2, 1);
  const halfHeight = Math.max(bounds.height / 2, 1);
  const scaleX = Math.abs(dx) / halfWidth;
  const scaleY = Math.abs(dy) / halfHeight;
  const scale = element.type === "ellipse"
    ? 1 / Math.max(Math.hypot(scaleX, scaleY), EPSILON)
    : element.type === "diamond"
      ? 1 / Math.max(scaleX + scaleY, EPSILON)
      : 1 / Math.max(scaleX, scaleY, EPSILON);

  return rotatePoint(
    { x: center.x + dx * scale, y: center.y + dy * scale },
    center,
    angle,
  );
}

