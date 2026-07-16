import { cloneElement } from "@/modules/draw-tool/entities/element/model/cloneElement";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";

/** Duplicates currently selected objects, offsets them by 20px and selects the copies. */
export function duplicateSelectedElements() {
  const selectedIds = new Set(selectionStore.get().elementIds);
  const selectedElements = sceneStore
    .get()
    .elements.filter((element) => selectedIds.has(element.id));

  if (selectedElements.length === 0) return false;

  historyStore.begin();
  const copies = selectedElements.map((element) =>
    cloneElement(element, { offset: { x: 20, y: 20 } }),
  );
  sceneStore.setElements([...sceneStore.get().elements, ...copies]);
  selectionStore.setElementIds(copies.map((element) => element.id));
  historyStore.commit();
  return true;
}

