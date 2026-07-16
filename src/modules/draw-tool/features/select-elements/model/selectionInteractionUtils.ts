import {
  createArrowBinding,
  canUseElementLabel,
  findArrowBindingTarget,
  getArrowBindingAnchor,
  hitTestElement,
} from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import {
  getFrameDescendantIds,
  getSelectableSceneElements,
  sceneStore,
} from "@/modules/draw-tool/entities/scene";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import type { Point, Rect } from "@/modules/draw-tool/shared/types";

const ARROW_BINDING_RADIUS = 18;

export function normalizeRect(start: Point, end: Point): Rect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function getPointerAngle(point: Point, center: Point) {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

export function canEditLabelOnCanvas(element: BoardElement) {
  return canUseElementLabel(element);
}

export function getWaypointHandleIndex(handle: string) {
  if (!handle.startsWith("waypoint:")) {
    return undefined;
  }

  const index = Number(handle.split(":")[1]);
  return Number.isInteger(index) ? index : undefined;
}

export function findTopSelectableElement(point: Point) {
  const scene = sceneStore.get();
  const elements = getSelectableSceneElements(scene);
  const hitElement = [...elements]
    .reverse()
    .find((element) => !element.locked && hitTestElement(element, point));

  if (hitElement?.type !== "frame") {
    return hitElement;
  }

  const descendantIds = getFrameDescendantIds(hitElement.id, elements);
  const childHit = [...elements]
    .reverse()
    .find(
      (element) =>
        descendantIds.has(element.id) &&
        !element.locked &&
        hitTestElement(element, point),
    );

  return childHit ?? hitElement;
}

export function getArrowEndpointBinding(point: Point, arrowId: string) {
  const target = findArrowBindingTarget(
    getSelectableSceneElements(sceneStore.get()),
    point,
    arrowId,
    ARROW_BINDING_RADIUS / viewportStore.get().zoom,
  );

  if (!target) {
    return undefined;
  }

  const binding = createArrowBinding(target, point);
  const anchorPoint = getArrowBindingAnchor(target, binding, point);

  return { anchorPoint, binding, targetId: target.id };
}

