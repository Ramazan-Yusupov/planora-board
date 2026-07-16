"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import {
  updateElement,
  type AdvancedElement,
} from "@/modules/draw-tool/entities/element";
import { sceneStore } from "@/modules/draw-tool/entities/scene";

import { usePlanoraAdapter } from "./PlanoraAdapterProvider";
import {
  getPlanoraTaskElementPatch,
  isPlanoraTaskElement,
} from "./taskCardElement";

export function PlanoraTaskSync() {
  const { tasks } = usePlanoraAdapter();
  const sceneVersion = useSyncExternalStore(
    sceneStore.subscribe,
    () => sceneStore.get().version,
    () => sceneStore.get().version,
  );
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );

  useEffect(() => {
    const hasChanges = sceneStore.get().elements.some((element) => {
      if (!isPlanoraTaskElement(element)) {
        return false;
      }

      return Boolean(
        getPlanoraTaskElementPatch(
          element,
          taskById.get(element.metadata.cardId),
        ),
      );
    });

    if (!hasChanges) {
      return;
    }

    sceneStore.updateAll((element) => {
      if (!isPlanoraTaskElement(element)) {
        return element;
      }

      const patch = getPlanoraTaskElementPatch(
        element,
        taskById.get(element.metadata.cardId),
      );

      if (!patch) {
        return element;
      }

      return updateElement(element as AdvancedElement, patch);
    });
  }, [sceneVersion, taskById]);

  return null;
}
