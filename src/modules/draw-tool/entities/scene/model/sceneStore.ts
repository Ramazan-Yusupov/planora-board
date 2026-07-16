import { syncElementRelations } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { createDefaultLayer, createScene } from "./createScene";
import { DEFAULT_LAYER_ID, type SceneLayer, type SceneState } from "./types";

type SceneListener = () => void;

let scene = createScene();
const listeners = new Set<SceneListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function cloneLayers(layers: SceneLayer[]) {
  return JSON.parse(JSON.stringify(layers)) as SceneLayer[];
}

function normalizeLayers(
  elements: BoardElement[],
  layers: SceneLayer[] | undefined,
  activeLayerId: string | undefined,
) {
  const now = Date.now();
  const nextLayers =
    layers && layers.length > 0 ? cloneLayers(layers) : [createDefaultLayer(now)];
  const layerIds = new Set(nextLayers.map((layer) => layer.id));

  elements.forEach((element) => {
    if (element.layerId && !layerIds.has(element.layerId)) {
      nextLayers.push({
        id: element.layerId,
        name: "Импортированный слой",
        visible: true,
        locked: false,
        createdAt: now,
        updatedAt: now,
      });
      layerIds.add(element.layerId);
    }
  });

  if (!layerIds.has(DEFAULT_LAYER_ID)) {
    nextLayers.unshift(createDefaultLayer(now));
    layerIds.add(DEFAULT_LAYER_ID);
  }

  const requestedActiveLayer = nextLayers.find(
    (layer) => layer.id === activeLayerId,
  );
  const fallbackActiveLayerId =
    nextLayers.find((layer) => layer.visible && !layer.locked)?.id ??
    nextLayers[0]?.id ??
    DEFAULT_LAYER_ID;
  const nextActiveLayerId =
    requestedActiveLayer?.visible && !requestedActiveLayer.locked
      ? requestedActiveLayer.id
      : fallbackActiveLayerId;

  return { activeLayerId: nextActiveLayerId, layerIds, layers: nextLayers };
}

function normalizeScene(nextScene: SceneState): SceneState {
  const { activeLayerId, layerIds, layers } = normalizeLayers(
    nextScene.elements,
    nextScene.layers,
    nextScene.activeLayerId,
  );
  const fallbackLayerId = layerIds.has(activeLayerId)
    ? activeLayerId
    : DEFAULT_LAYER_ID;
  const elements = nextScene.elements.map((element) =>
    element.layerId && layerIds.has(element.layerId)
      ? element
      : { ...element, layerId: fallbackLayerId },
  );

  return {
    ...nextScene,
    activeLayerId,
    elements: syncElementRelations(elements),
    layers,
  };
}

function setScene(nextScene: SceneState) {
  scene = normalizeScene(nextScene);
  notifyListeners();
}

function cloneElements(elements: BoardElement[]) {
  return JSON.parse(JSON.stringify(elements)) as BoardElement[];
}

export const sceneStore = {
  get() {
    return scene;
  },

  setScene(nextScene: Omit<SceneState, "version">) {
    setScene({
      ...nextScene,
      version: scene.version + 1,
    });
  },

  setElements(elements: BoardElement[]) {
    setScene({
      activeLayerId: scene.activeLayerId,
      elements: cloneElements(elements),
      layers: scene.layers,
      version: scene.version + 1,
    });
  },

  add(element: BoardElement) {
    setScene({
      activeLayerId: scene.activeLayerId,
      elements: [
        ...scene.elements,
        element.layerId ? element : { ...element, layerId: scene.activeLayerId },
      ],
      layers: scene.layers,
      version: scene.version + 1,
    });
  },

  updateById(
    elementId: string,
    updater: (element: BoardElement) => BoardElement,
  ) {
    setScene({
      activeLayerId: scene.activeLayerId,
      elements: scene.elements.map((element) =>
        element.id === elementId ? updater(element) : element,
      ),
      layers: scene.layers,
      version: scene.version + 1,
    });
  },

  updateAll(updater: (element: BoardElement) => BoardElement) {
    setScene({
      activeLayerId: scene.activeLayerId,
      elements: scene.elements.map(updater),
      layers: scene.layers,
      version: scene.version + 1,
    });
  },

  removeById(elementId: string) {
    setScene({
      activeLayerId: scene.activeLayerId,
      elements: scene.elements.filter((element) => element.id !== elementId),
      layers: scene.layers,
      version: scene.version + 1,
    });
  },

  removeMany(elementIds: string[]) {
    const ids = new Set(elementIds);
    setScene({
      activeLayerId: scene.activeLayerId,
      elements: scene.elements.filter((element) => !ids.has(element.id)),
      layers: scene.layers,
      version: scene.version + 1,
    });
  },

  addLayer(name = "Новый слой") {
    const now = Date.now();
    const layer: SceneLayer = {
      id: `layer-${now.toString(36)}`,
      name,
      visible: true,
      locked: false,
      createdAt: now,
      updatedAt: now,
    };

    setScene({
      activeLayerId: layer.id,
      elements: scene.elements,
      layers: [...scene.layers, layer],
      version: scene.version + 1,
    });

    return layer;
  },

  updateLayer(layerId: string, patch: Partial<Omit<SceneLayer, "id" | "createdAt">>) {
    if (!scene.layers.some((layer) => layer.id === layerId)) return false;
    const now = Date.now();

    setScene({
      activeLayerId: scene.activeLayerId,
      elements: scene.elements,
      layers: scene.layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...patch, updatedAt: now } : layer,
      ),
      version: scene.version + 1,
    });

    return true;
  },

  setActiveLayerId(layerId: string) {
    const layer = scene.layers.find((item) => item.id === layerId);
    if (!layer || !layer.visible || layer.locked) return false;

    setScene({
      activeLayerId: layer.id,
      elements: scene.elements,
      layers: scene.layers,
      version: scene.version + 1,
    });

    return true;
  },

  clear() {
    setScene(createScene());
  },

  subscribe(listener: SceneListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

