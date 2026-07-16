import type { Point } from "@/modules/draw-tool/shared/types";
import type { ArrowElement } from "../model/types";

const CURVE_SAMPLE_COUNT = 24;
const DEFAULT_CURVE_OFFSET = 0.22;

function getEndpoints(element: ArrowElement) {
  return {
    start: { x: element.x, y: element.y },
    end: {
      x: element.x + element.width,
      y: element.y + element.height,
    },
  };
}

/**
 * Returns the draggable control point for the smooth arrow route. The value is
 * stored as an offset along the normal to the start→end vector, so it remains
 * proportional when bound elements move farther apart or closer together.
 */
export function getArrowCurveControlPoint(element: ArrowElement): Point {
  const { start, end } = getEndpoints(element);
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY);
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  if (length < 0.001) {
    return midpoint;
  }

  const normal = { x: -deltaY / length, y: deltaX / length };
  const curveOffset = element.curveOffset ?? DEFAULT_CURVE_OFFSET;

  return {
    x: midpoint.x + normal.x * length * curveOffset,
    y: midpoint.y + normal.y * length * curveOffset,
  };
}

/** Converts a world-space curve handle back into the serializable offset. */
export function getArrowCurveOffset(element: ArrowElement, controlPoint: Point) {
  const { start, end } = getEndpoints(element);
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY);

  if (length < 0.001) {
    return 0;
  }

  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  const normal = { x: -deltaY / length, y: deltaX / length };

  return (
    ((controlPoint.x - midpoint.x) * normal.x +
      (controlPoint.y - midpoint.y) * normal.y) /
    length
  );
}

export function getQuadraticBezierPoint(
  start: Point,
  control: Point,
  end: Point,
  progress: number,
): Point {
  const inverse = 1 - progress;

  return {
    x:
      inverse * inverse * start.x +
      2 * inverse * progress * control.x +
      progress * progress * end.x,
    y:
      inverse * inverse * start.y +
      2 * inverse * progress * control.y +
      progress * progress * end.y,
  };
}

/**
 * Keeps the previous polyline API for hit-tests/export, while smooth arrows
 * are represented by sampled points from their quadratic Bézier curve.
 */
export function getArrowPathPoints(element: ArrowElement): Point[] {
  const { start, end } = getEndpoints(element);
  const waypoints =
    element.routing === "straight"
      ? element.waypoints?.filter(
          (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
        )
      : undefined;

  if (waypoints?.length) {
    return [start, ...waypoints, end];
  }

  if (element.routing === "straight") {
    return [start, end];
  }

  if (element.routing === "curve") {
    const control = getArrowCurveControlPoint(element);

    return Array.from({ length: CURVE_SAMPLE_COUNT + 1 }, (_, index) =>
      getQuadraticBezierPoint(start, control, end, index / CURVE_SAMPLE_COUNT),
    );
  }

  if (element.elbowAxis === "horizontal") {
    const bendX = start.x + element.width * element.elbowOffset;

    return [
      start,
      { x: bendX, y: start.y },
      { x: bendX, y: end.y },
      end,
    ];
  }

  const bendY = start.y + element.height * element.elbowOffset;

  return [
    start,
    { x: start.x, y: bendY },
    { x: end.x, y: bendY },
    end,
  ];
}

