import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { projectStore } from "@/modules/draw-tool/features/projects";

/** Saves the active project to IndexedDB. */
export function saveScene() {
  return projectStore.saveActiveProject(sceneStore.get().elements);
}

