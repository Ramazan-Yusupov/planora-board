import { useRef } from "react";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { attachAllFrameChildren, getFrameDescendantIds, sceneStore } from "@/modules/draw-tool/entities/scene";
import type { Point } from "@/modules/draw-tool/shared/types";
import { resizeElement } from "./resizeElements";
import type { ResizeHandle, ResizeModifiers } from "./types";

type ActiveResize = {
  elementId: string;
  handle: ResizeHandle;
  initialElement: BoardElement;
  initialFrameChildren: Map<string, BoardElement>;
  startPoint: Point;
};

const DEFAULT_MODIFIERS: ResizeModifiers = {
  snapToGrid: false,
  keepAspectRatio: false,
  resizeFromCenter: false,
};

function cloneElementForResize(element: BoardElement): BoardElement {
  return JSON.parse(JSON.stringify(element)) as BoardElement;
}

export function useResizeElements() {
  const resizeRef = useRef<ActiveResize | null>(null);

  function startResize(
    elementId: string,
    handle: ResizeHandle,
    startPoint: Point,
  ) {
    const selected = sceneStore.get().elements.find((item) => item.id === elementId);

    if (selected?.type === "frame") {
      sceneStore.setElements(attachAllFrameChildren(sceneStore.get().elements));
    }

    const elements = sceneStore.get().elements;
    const element = elements.find((item) => item.id === elementId);

    if (!element) {
      resizeRef.current = null;
      return;
    }

    const descendants =
      element.type === "frame"
        ? getFrameDescendantIds(element.id, elements)
        : new Set<string>();
    const initialFrameChildren = new Map(
      elements
        .filter((item) => descendants.has(item.id))
        .map((item) => [item.id, cloneElementForResize(item)] as const),
    );

    resizeRef.current = {
      elementId,
      handle,
      initialElement: cloneElementForResize(element),
      initialFrameChildren,
      startPoint,
    };
  }

  function updateResize(
    point: Point,
    modifiers: ResizeModifiers = DEFAULT_MODIFIERS,
  ) {
    const activeResize = resizeRef.current;

    if (!activeResize) {
      return false;
    }

    resizeElement(
      activeResize.initialElement,
      activeResize.handle,
      activeResize.startPoint,
      point,
      modifiers,
      activeResize.initialFrameChildren,
    );

    return true;
  }

  function finishResize() {
    const hadResize = resizeRef.current !== null;
    resizeRef.current = null;
    return hadResize;
  }

  return { finishResize, startResize, updateResize };
}

