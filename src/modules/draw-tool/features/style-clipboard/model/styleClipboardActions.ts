import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { updateElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { styleClipboardStore } from "./styleClipboardStore";

export function copyElementStyle(element: BoardElement) {
  styleClipboardStore.set(element.style);
}

export function applyCopiedStyleToSelectedElements() {
  const style = styleClipboardStore.get().style;
  const ids = new Set(selectionStore.get().elementIds);
  if (!style || ids.size === 0) return false;

  historyStore.begin();
  sceneStore.updateAll((element) => ids.has(element.id) ? updateElement(element, { style: { ...style } }) : element);
  return historyStore.commit();
}

