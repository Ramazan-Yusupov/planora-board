import type { Point } from "@/modules/draw-tool/shared/types";
import { getArrowBindingAnchor } from "./arrowBinding";
import { getElementCenter } from "./getElementCenter";
import { getRelationAnchor } from "./getRelationAnchor";
import type { ArrowElement, BoardElement, CalloutElement, ElementBinding } from "../model/types";

const EPSILON = 0.01;

function equal(a: number, b: number) {
  return Math.abs(a - b) < EPSILON;
}

function getBoundTarget(binding: ElementBinding | null | undefined, byId: Map<string, BoardElement>) {
  return binding ? byId.get(binding.elementId) : undefined;
}

function syncArrowWaypoints(
  arrow: ArrowElement,
  byId: Map<string, BoardElement>,
) {
  if (
    arrow.routing !== "straight" ||
    !arrow.waypoints?.length ||
    !arrow.waypointBindings?.length
  ) {
    return {
      waypointBindings:
        arrow.routing === "straight" &&
        arrow.waypoints?.length &&
        arrow.waypointBindings?.length
          ? arrow.waypointBindings
          : undefined,
      waypoints: arrow.waypoints,
    };
  }

  let changed = false;
  const waypointBindings = arrow.waypoints.map(
    (_, index) => arrow.waypointBindings?.[index] ?? null,
  );
  const waypoints = arrow.waypoints.map((waypoint, index) => {
    const binding = waypointBindings[index];
    const target = getBoundTarget(binding, byId);

    if (!binding || !target) {
      if (binding && !target) {
        waypointBindings[index] = null;
        changed = true;
      }

      return waypoint;
    }

    const nextWaypoint = getArrowBindingAnchor(target, binding, waypoint);
    changed ||=
      !equal(nextWaypoint.x, waypoint.x) || !equal(nextWaypoint.y, waypoint.y);

    return nextWaypoint;
  });

  return {
    waypointBindings:
      changed || waypointBindings.length !== arrow.waypointBindings.length
        ? waypointBindings
        : arrow.waypointBindings,
    waypoints: changed ? waypoints : arrow.waypoints,
  };
}

function syncArrow(arrow: ArrowElement, byId: Map<string, BoardElement>): ArrowElement {
  const rawStart = { x: arrow.x, y: arrow.y };
  const rawEnd = { x: arrow.x + arrow.width, y: arrow.y + arrow.height };
  const startTarget = getBoundTarget(arrow.startBinding, byId);
  const endTarget = getBoundTarget(arrow.endBinding, byId);

  const start = startTarget && arrow.startBinding
    ? getArrowBindingAnchor(startTarget, arrow.startBinding, rawEnd)
    : rawStart;
  const end = endTarget && arrow.endBinding
    ? getArrowBindingAnchor(endTarget, arrow.endBinding, start)
    : rawEnd;
  const refinedStart = startTarget && arrow.startBinding
    ? getArrowBindingAnchor(startTarget, arrow.startBinding, end)
    : start;
  const syncedWaypoints = syncArrowWaypoints(arrow, byId);

  if (
    equal(refinedStart.x, arrow.x) &&
    equal(refinedStart.y, arrow.y) &&
    equal(end.x, arrow.x + arrow.width) &&
    equal(end.y, arrow.y + arrow.height) &&
    syncedWaypoints.waypoints === arrow.waypoints &&
    syncedWaypoints.waypointBindings === arrow.waypointBindings
  ) {
    return arrow;
  }

  return {
    ...arrow,
    x: refinedStart.x,
    y: refinedStart.y,
    width: end.x - refinedStart.x,
    height: end.y - refinedStart.y,
    waypointBindings: syncedWaypoints.waypointBindings,
    waypoints: syncedWaypoints.waypoints,
  };
}

function getCalloutConnectionPoint(callout: CalloutElement, target: Point): Point {
  return getRelationAnchor(callout, target);
}

function syncCallout(callout: CalloutElement, byId: Map<string, BoardElement>): CalloutElement {
  const target = callout.targetId ? byId.get(callout.targetId) : undefined;
  if (!target) {
    return callout.targetId || callout.targetPoint
      ? { ...callout, targetId: undefined, targetPoint: undefined }
      : callout;
  }

  const targetPoint = getRelationAnchor(target, getElementCenter(callout));
  const connectionPoint = getCalloutConnectionPoint(callout, targetPoint);
  // Avoid a dead assignment while retaining the useful connection calc for the
  // renderer's geometric contract. The card itself remains freely movable.
  void connectionPoint;

  if (
    callout.targetPoint &&
    equal(callout.targetPoint.x, targetPoint.x) &&
    equal(callout.targetPoint.y, targetPoint.y)
  ) {
    return callout;
  }

  return { ...callout, targetPoint };
}

/** Synchronizes persisted relationships after any scene mutation. */
export function syncElementRelations(elements: BoardElement[]): BoardElement[] {
  const byId = new Map(elements.map((element) => [element.id, element]));
  let changed = false;

  const next = elements.map((element) => {
    if (element.type === "arrow") {
      const updated = syncArrow(element, byId);
      changed ||= updated !== element;
      return updated;
    }

    if (element.type === "callout") {
      const updated = syncCallout(element, byId);
      changed ||= updated !== element;
      return updated;
    }

    return element;
  });

  return changed ? next : elements;
}

