import { useSyncExternalStore } from "react";
import { getSceneElementById, getSceneElementsByIds, sceneStore } from "@/modules/draw-tool/entities/scene";
import { hasSingleSelection, selectionStore } from "@/modules/draw-tool/entities/selection";
import { toolStore } from "@/modules/draw-tool/entities/tool";

/** Shared live selection and tool data for the properties panel. */
export function usePropertiesPanel() {
  const activeTool = useSyncExternalStore(
    toolStore.subscribe,
    toolStore.get,
    toolStore.get,
  );
  const scene = useSyncExternalStore(
    sceneStore.subscribe,
    sceneStore.get,
    sceneStore.get,
  );
  const selection = useSyncExternalStore(
    selectionStore.subscribe,
    selectionStore.get,
    selectionStore.get,
  );
  const selectedElements = getSceneElementsByIds(
    scene,
    selection.elementIds,
  );
  const primaryElement = hasSingleSelection(selection)
    ? getSceneElementById(scene, selection.elementIds[0])
    : null;

  return { activeTool, primaryElement, scene, selectedElements, selection };
}

