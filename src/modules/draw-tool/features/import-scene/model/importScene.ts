import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import type { SceneState } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

/** Replaces the active canvas with a validated scene and resets transient UI state. */
export function importScene(sceneOrElements: BoardElement[] | Omit<SceneState, "version">) {
  historyStore.begin();
  if (Array.isArray(sceneOrElements)) {
    sceneStore.setElements(sceneOrElements);
  } else {
    sceneStore.setScene(sceneOrElements);
  }
  selectionStore.clear();
  historyStore.commit();
}

