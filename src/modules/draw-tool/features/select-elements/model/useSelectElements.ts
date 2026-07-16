import { useRef } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  getElementCenter,
  getElementRotation,
  updateElement,
} from "@/modules/draw-tool/entities/element";
import type { ElementBinding } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { textEditorStore } from "@/modules/draw-tool/features/edit-text";
import { editingLockStore } from "@/modules/draw-tool/features/lock-editing";
import { arrowBindingIndicatorStore } from "@/modules/draw-tool/features/arrow-binding";
import { ROTATION_SNAP_ANGLE, snapRotationAngle } from "@/modules/draw-tool/features/rotate-elements";
import { getWorldPointerPosition } from "@/modules/draw-tool/features/draw-shape/lib/getWorldPointerPosition";
import { useMoveElements } from "@/modules/draw-tool/features/move-elements";
import {
  findResizeHandleAtPoint,
  getElementRotationHandle,
  getResizeCursor,
  useResizeElements,
} from "@/modules/draw-tool/features/resize-elements";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import { normalizeAngleDelta } from "@/modules/draw-tool/shared/lib";
import type { Point } from "@/modules/draw-tool/shared/types";
import { selectByArea } from "./selectByArea";
import {
  canEditLabelOnCanvas,
  findTopSelectableElement,
  getArrowEndpointBinding,
  getPointerAngle,
  getWaypointHandleIndex,
  normalizeRect,
} from "./selectionInteractionUtils";

type SelectionInteraction =
  | { mode: "area"; pointerId: number; startPoint: Point; append: boolean }
  | { mode: "move"; pointerId: number }
  | {
      mode: "resize";
      pointerId: number;
      arrowEndpoint?: "start" | "end";
      arrowId?: string;
      arrowWaypoint?: boolean;
      arrowWaypointIndex?: number;
      binding?: ElementBinding;
    }
  | {
      mode: "rotate";
      pointerId: number;
      elementId: string;
      initialAngle: number;
      previousPointerAngle: number;
      accumulatedAngle: number;
      center: Point;
    }
  | null;

export function useSelectElements() {
  const interactionRef = useRef<SelectionInteraction>(null);
  const move = useMoveElements();
  const resize = useResizeElements();

  function updateSelectionCursor(
    event: ReactPointerEvent<HTMLCanvasElement>,
    point: Point,
  ) {
    const selection = selectionStore.get();
    const selectedElement =
      selection.elementIds.length === 1
        ? sceneStore
            .get()
            .elements.find(
              (element) => element.id === selection.elementIds[0] && !element.locked,
            )
        : undefined;

    if (!selectedElement) {
      event.currentTarget.style.cursor = "";
      return;
    }

    const zoom = viewportStore.get().zoom;
    const rotationHandle =
      selectedElement.type === "arrow"
        ? null
        : getElementRotationHandle(selectedElement, 30 / zoom);

    if (
      rotationHandle &&
      Math.hypot(
        point.x - rotationHandle.point.x,
        point.y - rotationHandle.point.y,
      ) <=
      11 / zoom
    ) {
      event.currentTarget.style.cursor = "crosshair";
      return;
    }

    const handle = findResizeHandleAtPoint(selectedElement, point, 10 / zoom);
    event.currentTarget.style.cursor = handle ? (getResizeCursor(handle) ?? "") : "";
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (editingLockStore.get().isLocked || event.button !== 0) {
      return;
    }

    const point = getWorldPointerPosition(event);
    const selection = selectionStore.get();
    const selectedElement =
      selection.elementIds.length === 1
        ? sceneStore
            .get()
            .elements.find(
              (element) => element.id === selection.elementIds[0] && !element.locked,
            )
        : undefined;
    const zoom = viewportStore.get().zoom;

    if (selectedElement) {
      const rotationHandle =
        selectedElement.type === "arrow"
          ? null
          : getElementRotationHandle(selectedElement, 30 / zoom);
      const isRotationHandle =
        rotationHandle &&
        Math.hypot(point.x - rotationHandle.point.x, point.y - rotationHandle.point.y) <=
        11 / zoom;

      if (isRotationHandle) {
        event.preventDefault();
        historyStore.begin();
        event.currentTarget.setPointerCapture(event.pointerId);
        const center = getElementCenter(selectedElement);
        interactionRef.current = {
          mode: "rotate",
          pointerId: event.pointerId,
          elementId: selectedElement.id,
          initialAngle: getElementRotation(selectedElement),
          previousPointerAngle: getPointerAngle(point, center),
          accumulatedAngle: 0,
          center,
        };
        return;
      }
    }

    const handle = selectedElement
      ? findResizeHandleAtPoint(selectedElement, point, 10 / zoom)
      : null;

    if (selectedElement && handle) {
      const waypointIndex = getWaypointHandleIndex(handle);
      historyStore.begin();
      event.currentTarget.setPointerCapture(event.pointerId);
      resize.startResize(selectedElement.id, handle, point);
      arrowBindingIndicatorStore.clear();
      interactionRef.current = {
        mode: "resize",
        pointerId: event.pointerId,
        ...(selectedElement.type === "arrow"
          ? {
              ...(handle === "start" || handle === "end"
                ? { arrowEndpoint: handle, arrowId: selectedElement.id }
                : {}),
              ...(handle.startsWith("waypoint:")
                ? {
                    arrowId: selectedElement.id,
                    arrowWaypoint: true,
                    arrowWaypointIndex: waypointIndex,
                  }
                : {}),
            }
          : {}),
      };
      return;
    }

    const hitElement = findTopSelectableElement(point);

    if (hitElement) {
      if ((event.ctrlKey || event.metaKey) && hitElement.link) {
        event.preventDefault();
        window.open(hitElement.link, "_blank", "noopener,noreferrer");
        return;
      }

      const isAlreadySelected = selection.elementIds.includes(hitElement.id);
      const groupIds = hitElement.groupId
        ? sceneStore
            .get()
            .elements.filter((element) => element.groupId === hitElement.groupId && !element.locked)
            .map((element) => element.id)
        : [hitElement.id];

      if (event.shiftKey || !isAlreadySelected) {
        selectionStore.setElementIds(
          event.shiftKey
            ? [...selectionStore.get().elementIds, ...groupIds]
            : groupIds,
        );
      }

      const elementIds = selectionStore.get().elementIds;

      if (!event.shiftKey && elementIds.length > 0) {
        historyStore.begin();
        event.currentTarget.setPointerCapture(event.pointerId);
        move.startMove(elementIds, point);
        interactionRef.current = { mode: "move", pointerId: event.pointerId };
      }

      return;
    }

    if (!event.shiftKey) {
      selectionStore.setElementIds([]);
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    selectionStore.setSelectionBox({ x: point.x, y: point.y, width: 0, height: 0 });
    interactionRef.current = {
      mode: "area",
      pointerId: event.pointerId,
      startPoint: point,
      append: event.shiftKey,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const interaction = interactionRef.current;
    const point = getWorldPointerPosition(event);

    if (!interaction || interaction.pointerId !== event.pointerId) {
      updateSelectionCursor(event, point);
      return;
    }

    if (interaction.mode === "rotate") {
      const pointerAngle = getPointerAngle(point, interaction.center);
      const delta = normalizeAngleDelta(pointerAngle - interaction.previousPointerAngle);
      interaction.previousPointerAngle = pointerAngle;
      interaction.accumulatedAngle += delta;

      const nextAngle = interaction.initialAngle + interaction.accumulatedAngle;
      const shouldSnapRotation = event.shiftKey || event.ctrlKey || event.metaKey;

      sceneStore.updateById(interaction.elementId, (element) =>
        updateElement(element, {
          angle: shouldSnapRotation
            ? snapRotationAngle(nextAngle, ROTATION_SNAP_ANGLE)
            : nextAngle,
        }),
      );
      return;
    }

    if (interaction.mode === "resize") {
      let resizePoint = point;
      let snappedToElementBoundary = false;

      if (interaction.arrowId && (interaction.arrowEndpoint || interaction.arrowWaypoint)) {
        const candidate = getArrowEndpointBinding(point, interaction.arrowId);

        if (candidate) {
          resizePoint = candidate.anchorPoint;
          snappedToElementBoundary = true;
          interaction.binding = candidate.binding;
          arrowBindingIndicatorStore.set({
            targetId: candidate.targetId,
            anchorPoint: candidate.anchorPoint,
          });
        } else {
          interaction.binding = undefined;
          arrowBindingIndicatorStore.clear();
        }
      }

      resize.updateResize(resizePoint, {
        snapToGrid:
          !snappedToElementBoundary && (event.ctrlKey || event.metaKey),
        keepAspectRatio: event.shiftKey,
        resizeFromCenter: event.altKey,
      });
      return;
    }

    if (interaction.mode === "move") {
      move.updateMove(point, {
        alignToElements: event.ctrlKey || event.metaKey,
        constrainToAxis: event.shiftKey,
        zoom: viewportStore.get().zoom,
      });
      return;
    }

    selectionStore.setSelectionBox(normalizeRect(interaction.startPoint, point));
  }

  function finishInteraction(event: ReactPointerEvent<HTMLCanvasElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (interaction.mode === "area") {
      const selectionBox = selectionStore.get().selectionBox;
      if (selectionBox) {
        selectByArea(selectionBox, interaction.append);
      }
    }

    if (
      interaction.mode === "resize" &&
      interaction.arrowEndpoint &&
      interaction.arrowId &&
      interaction.binding
    ) {
      sceneStore.updateById(interaction.arrowId, (element) =>
        element.type === "arrow"
          ? updateElement(element, {
              ...(interaction.arrowEndpoint === "start"
                ? { startBinding: interaction.binding }
                : { endBinding: interaction.binding }),
            })
          : element,
      );
    }

    if (
      interaction.mode === "resize" &&
      interaction.arrowWaypoint &&
      interaction.arrowId &&
      interaction.arrowWaypointIndex !== undefined
    ) {
      sceneStore.updateById(interaction.arrowId, (element) => {
        if (element.type !== "arrow") {
          return element;
        }

        const waypointBindings = [...(element.waypointBindings ?? [])];
        waypointBindings.length = element.waypoints?.length ?? 0;
        waypointBindings[interaction.arrowWaypointIndex!] =
          interaction.binding ?? null;

        return updateElement(element, { waypointBindings });
      });
    }

    const finishedMove = move.finishMove();
    const finishedResize = resize.finishResize();
    arrowBindingIndicatorStore.clear();

    if (
      finishedMove ||
      finishedResize ||
      interaction.mode === "rotate"
    ) {
      historyStore.commit();
    }
    interactionRef.current = null;
    selectionStore.setSelectionBox(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onDoubleClick(event: ReactMouseEvent<HTMLCanvasElement>) {
    if (editingLockStore.get().isLocked) {
      return;
    }

    const hitElement = findTopSelectableElement(getWorldPointerPosition(event));
    if (hitElement?.type === "text" || hitElement?.type === "sticky" || hitElement?.type === "callout") {
      selectionStore.setElementIds([hitElement.id]);
      historyStore.begin();
      textEditorStore.open(hitElement.id);
      return;
    }

    if (hitElement && canEditLabelOnCanvas(hitElement)) {
      selectionStore.setElementIds([hitElement.id]);
      historyStore.begin();
      textEditorStore.openLabel(hitElement.id);
    }
  }

  return {
    onDoubleClick,
    onPointerCancel: finishInteraction,
    onPointerDown,
    onPointerMove,
    onPointerUp: finishInteraction,
  };
}

