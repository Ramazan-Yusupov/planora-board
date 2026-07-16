import { DEFAULT_LAYER_ID, type SceneLayer, type SceneState } from "./types";

export function createDefaultLayer(now = Date.now()): SceneLayer {
  return {
    id: DEFAULT_LAYER_ID,
    name: "Основной слой",
    visible: true,
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createScene(): SceneState {
  const defaultLayer = createDefaultLayer();

  return {
    activeLayerId: defaultLayer.id,
    elements: [],
    layers: [defaultLayer],
    version: 0,
  };
}

