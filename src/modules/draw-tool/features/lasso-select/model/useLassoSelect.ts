import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { getElementCenter } from "@/modules/draw-tool/entities/element";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { toolLockStore } from "@/modules/draw-tool/features/tool-lock";
import { getWorldPointerPosition } from "@/modules/draw-tool/features/draw-shape/lib/getWorldPointerPosition";
import type { Point } from "@/modules/draw-tool/shared/types";
import { isPointInPolygon } from "../lib/isPointInPolygon";
import { lassoStore } from "./lassoStore";

type LassoInteraction = { pointerId: number; points: Point[] } | null;

export function useLassoSelect() {
  const interactionRef = useRef<LassoInteraction>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) {
      return;
    }

    const point = getWorldPointerPosition(event);
    interactionRef.current = { pointerId: event.pointerId, points: [point] };
    lassoStore.set([point]);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    const point = getWorldPointerPosition(event);
    const previous = interaction.points.at(-1);
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 2) {
      return;
    }

    interaction.points = [...interaction.points, point];
    lassoStore.set(interaction.points);
  }

  function finish(event: ReactPointerEvent<HTMLCanvasElement>) {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (interaction.points.length >= 3) {
      const selectedIds = sceneStore
        .get()
        .elements.filter((element) =>
          isPointInPolygon(getElementCenter(element), interaction.points),
        )
        .map((element) => element.id);
      selectionStore.setElementIds(selectedIds);
    }

    interactionRef.current = null;
    lassoStore.clear();

    // Лассо возвращается к курсору, если пользователь не закрепил инструмент.
    if (!toolLockStore.get()) {
      toolStore.set("selection");
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    onPointerCancel: finish,
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
  };
}

