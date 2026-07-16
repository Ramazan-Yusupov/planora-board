import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";

export function deleteElements(elementIds: string[]) {
  if (elementIds.length === 0) {
    return false;
  }

  historyStore.begin();
  sceneStore.removeMany(elementIds);
  selectionStore.setElementIds(
    selectionStore.get().elementIds.filter((id) => !elementIds.includes(id)),
  );
  historyStore.commit();
  return true;
}

export function deleteSelectedElements() {
  return deleteElements(selectionStore.get().elementIds);
}

