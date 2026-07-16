import { useCallback, useMemo, useSyncExternalStore } from "react";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { getSceneElementCount, sceneStore } from "@/modules/draw-tool/entities/scene";
import { isElementSelected, selectionStore } from "@/modules/draw-tool/entities/selection";
import { getLayers } from "./getLayers";

/** Supplies topmost-first layers and selection actions for the layers panel. */
export function useLayersPanel() {
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
  const layers = useMemo(() => getLayers(scene.elements, scene.layers), [scene]);
  const activeLayer = scene.layers.find((layer) => layer.id === scene.activeLayerId);
  const selectLayer = useCallback(
    (id: string) => selectionStore.setElementIds([id]),
    [],
  );
  const isSelected = useCallback(
    (id: string) => isElementSelected(selection, id),
    [selection],
  );

  const addLayer = useCallback(() => {
    historyStore.begin();
    sceneStore.addLayer();
    selectionStore.clear();
    historyStore.commit();
  }, []);

  const setActiveLayer = useCallback((id: string) => {
    sceneStore.setActiveLayerId(id);
  }, []);

  const renameLayer = useCallback((id: string, name: string) => {
    const nextName = name.trim();
    if (nextName) {
      historyStore.begin();
      sceneStore.updateLayer(id, { name: nextName });
      historyStore.commit();
    }
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    const layer = sceneStore.get().layers.find((item) => item.id === id);
    if (!layer) return;
    historyStore.begin();
    sceneStore.updateLayer(id, { visible: !layer.visible });
    const hiddenIds = new Set(
      sceneStore
        .get()
        .elements.filter((element) => element.layerId === id)
        .map((element) => element.id),
    );
    selectionStore.setElementIds(
      selectionStore.get().elementIds.filter((elementId) => !hiddenIds.has(elementId)),
    );
    historyStore.commit();
  }, []);

  const toggleLayerLock = useCallback((id: string) => {
    const layer = sceneStore.get().layers.find((item) => item.id === id);
    if (!layer) return;
    historyStore.begin();
    sceneStore.updateLayer(id, { locked: !layer.locked });
    if (!layer.locked) {
      const lockedIds = new Set(
        sceneStore
          .get()
          .elements.filter((element) => element.layerId === id)
          .map((element) => element.id),
      );
      selectionStore.setElementIds(
        selectionStore.get().elementIds.filter((elementId) => !lockedIds.has(elementId)),
      );
    }
    historyStore.commit();
  }, []);

  return {
    activeLayerId: scene.activeLayerId,
    activeLayerName: activeLayer?.name ?? "Слой",
    addLayer,
    count: getSceneElementCount(scene),
    isSelected,
    layers,
    renameLayer,
    selectLayer,
    setActiveLayer,
    toggleLayerLock,
    toggleLayerVisibility,
  };
}

