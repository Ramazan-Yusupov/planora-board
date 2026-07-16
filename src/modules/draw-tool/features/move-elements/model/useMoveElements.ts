import { useRef } from "react";
import { getSelectionBounds } from "@/modules/draw-tool/entities/selection";
import {
  attachAllFrameChildren,
  clampDeltaToParentFrame,
  getFrameDescendantIds,
  reparentElements,
  sceneStore,
} from "@/modules/draw-tool/entities/scene";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { getAlignmentSnap } from "../lib/getAlignmentSnap";
import { alignmentGuidesStore } from "./alignmentGuidesStore";
import { moveElementByDelta } from "./moveElements";
import type { Point, Rect } from "@/modules/draw-tool/shared/types";

type MoveAxis = "x" | "y";

type MoveOptions = {
  alignToElements: boolean;
  constrainToAxis: boolean;
  zoom: number;
};

type MoveState = {
  elementIds: string[];
  rootElementIds: string[];
  initialBounds: Rect | null;
  initialElements: Map<string, BoardElement>;
  lockedAxis: MoveAxis | null;
  startPoint: Point;
};

function getInitialElements(elementIds: string[]) {
  const selectedIds = new Set(elementIds);

  return new Map(
    sceneStore
      .get()
      .elements.filter((element) => selectedIds.has(element.id))
      .map((element) => [element.id, element] as const),
  );
}

export function useMoveElements() {
  const moveRef = useRef<MoveState | null>(null);

  function startMove(elementIds: string[], startPoint: Point) {
    const selectedFrames = sceneStore
      .get()
      .elements.filter((element) => elementIds.includes(element.id) && element.type === "frame");

    if (selectedFrames.length > 0) {
      sceneStore.setElements(attachAllFrameChildren(sceneStore.get().elements));
    }

    const sceneElements = sceneStore.get().elements;
    const expandedIds = new Set(elementIds);

    elementIds.forEach((elementId) => {
      const element = sceneElements.find((item) => item.id === elementId);
      if (element?.type === "frame") {
        getFrameDescendantIds(element.id, sceneElements).forEach((id) =>
          expandedIds.add(id),
        );
      }
    });

    const movingIds = [...expandedIds];
    const initialElements = getInitialElements(movingIds);

    moveRef.current = {
      elementIds: movingIds,
      rootElementIds: elementIds,
      initialBounds: getSelectionBounds([...initialElements.values()]),
      initialElements,
      lockedAxis: null,
      startPoint,
    };

    alignmentGuidesStore.clear();
  }

  function getConstrainedDelta(
    moveState: MoveState,
    point: Point,
    constrainToAxis: boolean,
  ) {
    let deltaX = point.x - moveState.startPoint.x;
    let deltaY = point.y - moveState.startPoint.y;

    if (!constrainToAxis) {
      moveState.lockedAxis = null;
      return { deltaX, deltaY };
    }

    if (!moveState.lockedAxis && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
      moveState.lockedAxis =
        Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y";
    }

    if (moveState.lockedAxis === "x") {
      deltaY = 0;
    }

    if (moveState.lockedAxis === "y") {
      deltaX = 0;
    }

    return { deltaX, deltaY };
  }

  function updateMove(point: Point, options: MoveOptions) {
    const moveState = moveRef.current;

    if (!moveState) {
      return false;
    }

    const constrainedDelta = getConstrainedDelta(
      moveState,
      point,
      options.constrainToAxis,
    );
    let deltaX = constrainedDelta.deltaX;
    let deltaY = constrainedDelta.deltaY;

    if (options.alignToElements && moveState.initialBounds) {
      const movingBounds: Rect = {
        x: moveState.initialBounds.x + deltaX,
        y: moveState.initialBounds.y + deltaY,
        width: moveState.initialBounds.width,
        height: moveState.initialBounds.height,
      };
      const selectedIds = new Set(moveState.elementIds);
      const snapResult = getAlignmentSnap({
        allowHorizontal: moveState.lockedAxis !== "y",
        allowVertical: moveState.lockedAxis !== "x",
        movingBounds,
        staticElements: sceneStore
          .get()
          .elements.filter((element) => !selectedIds.has(element.id)),
        threshold: 8 / options.zoom,
      });

      deltaX += snapResult.deltaX;
      deltaY += snapResult.deltaY;
      alignmentGuidesStore.set(snapResult.guides);
    } else {
      alignmentGuidesStore.clear();
    }

    const movingIds = new Set(moveState.elementIds);
    const currentElements = sceneStore.get().elements;

    sceneStore.updateAll((element) => {
      const initialElement = moveState.initialElements.get(element.id);
      if (!initialElement) return element;

      let elementDelta = { x: deltaX, y: deltaY };
      const parent = initialElement.parentId
        ? currentElements.find(
            (candidate): candidate is Extract<BoardElement, { type: "frame" }> =>
              candidate.id === initialElement.parentId && candidate.type === "frame",
          )
        : undefined;

      if (parent && !movingIds.has(parent.id)) {
        elementDelta = clampDeltaToParentFrame(initialElement, elementDelta, parent);
      }

      return moveElementByDelta(initialElement, elementDelta);
    });

    return true;
  }

  function finishMove() {
    const moveState = moveRef.current;
    const hadMove = moveState !== null;

    if (moveState) {
      sceneStore.setElements(
        reparentElements(sceneStore.get().elements, moveState.rootElementIds),
      );
    }

    moveRef.current = null;
    alignmentGuidesStore.clear();
    return hadMove;
  }

  return { finishMove, startMove, updateMove };
}

