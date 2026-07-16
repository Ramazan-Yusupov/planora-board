import type { ArrowElement } from "@/modules/draw-tool/entities/element";

export const MAX_WAYPOINTS = 10;

function getMidpointBetween(
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  return {
    x: start.x + (end.x - start.x) / 2,
    y: start.y + (end.y - start.y) / 2,
  };
}

export function createWaypointInsertPatch(arrow: ArrowElement) {
  const currentWaypointsCount = arrow.waypoints?.length ?? 0;

  if (currentWaypointsCount >= MAX_WAYPOINTS) {
    return null;
  }

  const points = [
    { x: arrow.x, y: arrow.y },
    ...(arrow.waypoints ?? []),
    { x: arrow.x + arrow.width, y: arrow.y + arrow.height },
  ];
  const segments = points.slice(0, -1).map((start, index) => ({
    end: points[index + 1],
    index,
    length: Math.hypot(
      points[index + 1].x - start.x,
      points[index + 1].y - start.y,
    ),
    start,
  }));
  const target = segments.sort((left, right) => right.length - left.length)[0];

  if (!target) {
    return null;
  }

  const waypoints = [...(arrow.waypoints ?? [])];
  const waypointBindings = [...(arrow.waypointBindings ?? [])];
  waypoints.splice(
    target.index,
    0,
    getMidpointBetween(target.start, target.end),
  );
  waypointBindings.length = arrow.waypoints?.length ?? 0;
  waypointBindings.splice(target.index, 0, null);

  return {
    waypointBindings: waypointBindings.slice(0, MAX_WAYPOINTS),
    waypoints: waypoints.slice(0, MAX_WAYPOINTS),
  };
}

