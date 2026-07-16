import type { SceneState } from "@/modules/draw-tool/entities/scene";
import type { HistorySnapshot } from "../model/types";

/** Creates an immutable copy that can safely be placed in undo/redo history. */
export function getHistorySnapshot(scene: SceneState): HistorySnapshot {
  return {
    activeLayerId: scene.activeLayerId,
    elements: JSON.parse(JSON.stringify(scene.elements)) as HistorySnapshot["elements"],
    layers: JSON.parse(JSON.stringify(scene.layers)) as HistorySnapshot["layers"],
  };
}

