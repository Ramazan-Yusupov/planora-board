import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SceneState } from "./types";

/** Finds one element by id without exposing scene storage details. */
export function getSceneElementById(scene: SceneState, id: string) {
  return scene.elements.find((element) => element.id === id) ?? null;
}

/** Returns elements in scene order for the requested ids. */
export function getSceneElementsByIds(scene: SceneState, ids: readonly string[]) {
  const requestedIds = new Set(ids);
  return scene.elements.filter((element) => requestedIds.has(element.id));
}

/** Narrow selector for render and UI counters. */
export function getSceneElementCount(scene: SceneState) {
  return scene.elements.length;
}

export function getSceneElementsByType<T extends BoardElement["type"]>(
  scene: SceneState,
  type: T,
) {
  return scene.elements.filter((element) => element.type === type);
}

export function getSceneLayerById(scene: SceneState, layerId: string) {
  return scene.layers.find((layer) => layer.id === layerId) ?? null;
}

export function getActiveSceneLayer(scene: SceneState) {
  return getSceneLayerById(scene, scene.activeLayerId) ?? scene.layers[0] ?? null;
}

export function isElementLayerVisible(scene: SceneState, element: BoardElement) {
  const layer = getSceneLayerById(scene, element.layerId ?? scene.activeLayerId);
  return layer?.visible ?? true;
}

export function isElementLayerLocked(scene: SceneState, element: BoardElement) {
  const layer = getSceneLayerById(scene, element.layerId ?? scene.activeLayerId);
  return layer?.locked ?? false;
}

export function getVisibleSceneElements(scene: SceneState) {
  return scene.elements.filter((element) => isElementLayerVisible(scene, element));
}

export function getSelectableSceneElements(scene: SceneState) {
  return scene.elements.filter(
    (element) =>
      isElementLayerVisible(scene, element) &&
      !isElementLayerLocked(scene, element) &&
      !element.locked,
  );
}

