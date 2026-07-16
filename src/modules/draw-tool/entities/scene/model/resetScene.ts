import { historyStore } from "@/modules/draw-tool/entities/history";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { sceneStore } from "./sceneStore";

/** Clears the canvas together with selection and undo/redo state. */
export function resetScene() {
  sceneStore.clear();
  selectionStore.clear();
  historyStore.clear();
}

