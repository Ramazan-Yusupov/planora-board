import { selectionStore } from "@/modules/draw-tool/entities/selection";

export function selectElement(elementId: string, append = false) {
  if (append) {
    selectionStore.toggleElementId(elementId);
    return;
  }

  selectionStore.setElementIds([elementId]);
}

