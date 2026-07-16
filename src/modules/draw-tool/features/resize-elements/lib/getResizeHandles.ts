import {
  getArrowCurveControlPoint,
  getArrowPathPoints,
  getElementBounds,
  getElementCenter,
  getElementRotation,
} from "@/modules/draw-tool/entities/element";
import type { ArrowElement, BoardElement } from "@/modules/draw-tool/entities/element";
import { rotatePoint } from "@/modules/draw-tool/shared/lib";
import type { Point } from "@/modules/draw-tool/shared/types";
import type { ResizeHandle, ResizeHandlePoint } from "../model/types";

function getArrowBendHandle(element: ArrowElement): Point | null {
  if (element.routing !== "elbow") {
    return null;
  }

  const points = getArrowPathPoints(element);
  const bendStart = points[1];
  const bendEnd = points[2];

  if (!bendStart || !bendEnd) {
    return null;
  }

  return {
    x: (bendStart.x + bendEnd.x) / 2,
    y: (bendStart.y + bendEnd.y) / 2,
  };
}

function toWorldPoint(element: BoardElement, point: Point) {
  return rotatePoint(point, getElementCenter(element), getElementRotation(element));
}

/**
 * The small rotation circle lives above the visual top edge. The distance is
 * supplied in world pixels by the renderer and pointer interaction.
 */
export function getElementRotationHandle(
  element: BoardElement,
  offset = 30,
): ResizeHandlePoint {
  const bounds = getElementBounds(element);
  const localPoint = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y - offset,
  };

  return { handle: "rotate", point: toWorldPoint(element, localPoint) };
}

export function getElementResizeHandles(
  element: BoardElement,
): ResizeHandlePoint[] {
  if (element.type === "line" || element.type === "arrow" || element.type === "measure") {
    const connectorHandles: ResizeHandlePoint[] = [
      { handle: "start", point: { x: element.x, y: element.y } },
      {
        handle: "end",
        point: { x: element.x + element.width, y: element.y + element.height },
      },
    ];
    const result: ResizeHandlePoint[] = connectorHandles.map((item) => ({
      ...item,
      point: toWorldPoint(element, item.point),
    }));

    if (element.type === "arrow") {
      const bendPoint = getArrowBendHandle(element);
      if (bendPoint) {
        result.push({ handle: "elbow", point: toWorldPoint(element, bendPoint) });
      }

      if (element.routing === "straight") {
        element.waypoints?.forEach((waypoint, index) => {
          result.push({
            handle: `waypoint:${index}`,
            point: toWorldPoint(element, waypoint),
          });
        });
      }

      if (element.routing === "curve") {
        result.push({
          handle: "curve",
          point: toWorldPoint(element, getArrowCurveControlPoint(element)),
        });
      }
    }

    return result;
  }

  const bounds = getElementBounds(element);
  const x2 = bounds.x + bounds.width;
  const y2 = bounds.y + bounds.height;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  const handles: ResizeHandlePoint[] = [
    { handle: "nw", point: { x: bounds.x, y: bounds.y } },
    { handle: "n", point: { x: centerX, y: bounds.y } },
    { handle: "ne", point: { x: x2, y: bounds.y } },
    { handle: "e", point: { x: x2, y: centerY } },
    { handle: "se", point: { x: x2, y: y2 } },
    { handle: "s", point: { x: centerX, y: y2 } },
    { handle: "sw", point: { x: bounds.x, y: y2 } },
    { handle: "w", point: { x: bounds.x, y: centerY } },
  ];

  return handles.map((item) => ({
    ...item,
    point: toWorldPoint(element, item.point),
  }));
}

export function findResizeHandleAtPoint(
  element: BoardElement,
  point: Point,
  radius: number,
): ResizeHandle | null {
  const matchedHandle = getElementResizeHandles(element).find((item) =>
    Math.hypot(point.x - item.point.x, point.y - item.point.y) <= radius,
  );

  return matchedHandle?.handle ?? null;
}

