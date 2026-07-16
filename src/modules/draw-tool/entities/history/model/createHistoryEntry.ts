import type { SceneState } from "@/modules/draw-tool/entities/scene";
import { getHistorySnapshot } from "../lib/getHistorySnapshot";
import type { HistorySnapshot } from "./types";

/** Creates an immutable scene entry for undo/redo stacks. */
export function createHistoryEntry(scene: SceneState): HistorySnapshot {
  return getHistorySnapshot(scene);
}

