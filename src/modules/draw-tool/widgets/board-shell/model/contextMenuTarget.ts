import type { MouseEvent as ReactMouseEvent } from "react";
import { hitTestElement } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { screenToWorld, viewportStore } from "@/modules/draw-tool/entities/viewport";
import { getCanvasPointerPosition } from "@/modules/draw-tool/shared/lib/dom/getCanvasPointerPosition";

export function getContextMenuTarget(
  event: ReactMouseEvent<HTMLCanvasElement>,
) {
  const canvasPoint = getCanvasPointerPosition(
    event.nativeEvent,
    event.currentTarget,
  );
  const worldPoint = screenToWorld(canvasPoint, viewportStore.get());

  return [...sceneStore.get().elements]
    .reverse()
    .find((element) => hitTestElement(element, worldPoint));
}

export function getContextSelectionIds(target: BoardElement) {
  if (!target.groupId) {
    return [target.id];
  }

  return sceneStore
    .get()
    .elements.filter(
      (element) => element.groupId === target.groupId && !element.locked,
    )
    .map((element) => element.id);
}

