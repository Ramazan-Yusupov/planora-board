import {
  getArrowCurveOffset,
  getElementBounds,
  getElementCenter,
  getElementRotation,
  updateElement,
} from "@/modules/draw-tool/entities/element";
import type { BoardElement, FrameElement } from "@/modules/draw-tool/entities/element";
import {
  expandFramesToFitChildren,
  scaleFrameChild,
  sceneStore,
} from "@/modules/draw-tool/entities/scene";
import { CANVAS_CONFIG } from "@/modules/draw-tool/shared/config";
import { clamp, rotatePoint } from "@/modules/draw-tool/shared/lib";
import { snapPointToGrid } from "@/modules/draw-tool/shared/lib/math/snapPointToGrid";
import type { Point } from "@/modules/draw-tool/shared/types";
import { calculateResize } from "../lib/calculateResize";
import type { ResizeHandle, ResizeModifiers } from "./types";
import {
  anchorRotatedPatch,
  getGeometry,
  snapConnectorPatch,
  snapShapePatch,
} from "./resizeGeometry";
import { resizeTextElement } from "./resizeTextElement";

export function resizeElement(
  element: BoardElement,
  handle: ResizeHandle,
  startPoint: Point,
  currentPoint: Point,
  modifiers: ResizeModifiers,
  initialFrameChildren = new Map<string, BoardElement>(),
) {
  if (
    element.type === "arrow" &&
    element.routing === "straight" &&
    handle.startsWith("waypoint:")
  ) {
    const waypointIndex = Number(handle.split(":")[1]);
    const point = modifiers.snapToGrid
      ? snapPointToGrid(currentPoint, CANVAS_CONFIG.defaultSnapSize)
      : currentPoint;

    sceneStore.updateById(element.id, (current) => {
      if (current.type !== "arrow") return current;
      const waypoints = [...(current.waypoints ?? [])];
      if (!Number.isInteger(waypointIndex) || !waypoints[waypointIndex]) {
        return current;
      }

      const waypointBindings = [...(current.waypointBindings ?? [])];
      waypoints[waypointIndex] = point;
      if (waypointBindings.length > 0) {
        waypointBindings.length = waypoints.length;
        waypointBindings[waypointIndex] = null;
      }

      return updateElement(current, {
        waypointBindings:
          waypointBindings.length > 0 ? waypointBindings : undefined,
        waypoints,
      });
    });
    return;
  }

  if (element.type === "arrow" && handle.startsWith("waypoint:")) {
    return;
  }

  if (element.type === "arrow" && handle === "elbow") {
    const point = modifiers.snapToGrid
      ? snapPointToGrid(currentPoint, CANVAS_CONFIG.defaultSnapSize)
      : currentPoint;
    const nextOffset =
      element.elbowAxis === "horizontal"
        ? (point.x - element.x) / (element.width || 1)
        : (point.y - element.y) / (element.height || 1);

    sceneStore.updateById(element.id, (current) =>
      current.type === "arrow"
        ? updateElement(current, { elbowOffset: clamp(nextOffset, 0.05, 0.95) })
        : current,
    );
    return;
  }

  if (element.type === "arrow" && handle === "curve") {
    const center = getElementCenter(element);
    const localPoint = rotatePoint(
      modifiers.snapToGrid
        ? snapPointToGrid(currentPoint, CANVAS_CONFIG.defaultSnapSize)
        : currentPoint,
      center,
      -getElementRotation(element),
    );

    sceneStore.updateById(element.id, (current) =>
      current.type === "arrow"
        ? updateElement(current, {
            curveOffset: clamp(getArrowCurveOffset(element, localPoint), -2.5, 2.5),
          })
        : current,
    );
    return;
  }

  // Handles are displayed in world space after rotation. Convert both pointer
  // points back into the element's local coordinate system before resizing.
  const center = getElementCenter(element);
  const inverseAngle = -getElementRotation(element);
  const localStartPoint = rotatePoint(startPoint, center, inverseAngle);
  const localCurrentPoint = rotatePoint(currentPoint, center, inverseAngle);

  const rawPatch = calculateResize(
    element,
    handle,
    localStartPoint,
    localCurrentPoint,
    {
      ...modifiers,
      // Raster and vector images retain their intrinsic proportions by default.
      keepAspectRatio: modifiers.keepAspectRatio || element.type === "image",
    },
  );
  const patch = modifiers.snapToGrid
    ? element.type === "line" || element.type === "arrow" || element.type === "measure"
      ? snapConnectorPatch(element, handle, rawPatch)
      : snapShapePatch(element, handle, rawPatch)
    : rawPatch;
  const anchoredPatch = anchorRotatedPatch(
    element,
    handle,
    patch,
    modifiers.resizeFromCenter,
  );

  if (element.type === "frame") {
    const nextFrame = updateElement(element, anchoredPatch) as FrameElement;

    sceneStore.updateAll((current) => {
      if (current.id === element.id) {
        return nextFrame;
      }

      const initialChild = initialFrameChildren.get(current.id);
      return initialChild
        ? scaleFrameChild(initialChild, element, nextFrame)
        : current;
    });
    return;
  }

  if (element.type === "freedraw" || element.type === "highlighter") {
    const geometry = getGeometry(element, anchoredPatch);
    const bounds = getElementBounds(element);
    const scaleX = geometry.width / Math.max(bounds.width, 1);
    const scaleY = geometry.height / Math.max(bounds.height, 1);
    const points = element.points.map((point) => ({
      x: geometry.x + (point.x - bounds.x) * scaleX,
      y: geometry.y + (point.y - bounds.y) * scaleY,
    }));

    sceneStore.updateById(element.id, (current) =>
      current.type === "freedraw" || current.type === "highlighter"
        ? updateElement(current, { ...geometry, points })
        : current,
    );
    return;
  }

  if (element.type === "text") {
    const textPatch = resizeTextElement(element, handle, patch, modifiers);
    const anchoredTextPatch = anchorRotatedPatch(
      element,
      handle,
      textPatch,
      modifiers.resizeFromCenter,
    );
    sceneStore.updateById(element.id, (current) =>
      current.type === "text" ? updateElement(current, anchoredTextPatch) : current,
    );

    const nextElements = expandFramesToFitChildren(sceneStore.get().elements);
    if (nextElements !== sceneStore.get().elements) {
      sceneStore.setElements(nextElements);
    }
    return;
  }

  sceneStore.updateById(element.id, (current) => {
    if (current.type === "arrow" && (handle === "start" || handle === "end")) {
      return updateElement(current, {
        ...anchoredPatch,
        ...(handle === "start" ? { startBinding: undefined } : { endBinding: undefined }),
      });
    }
    return updateElement(current, anchoredPatch);
  });
}

