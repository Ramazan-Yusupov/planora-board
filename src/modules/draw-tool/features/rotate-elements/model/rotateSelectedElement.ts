import { getElementRotation, updateElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";

function getSingleSelectedElementId() {
  const selectedIds = selectionStore.get().elementIds;

  return selectedIds.length === 1 ? selectedIds[0] : null;
}

/**
 * Rotates the single selected element and records one undo/redo operation.
 * Multi-selection is intentionally ignored because the canvas only exposes
 * a rotation handle for one selected element.
 */
export function rotateSelectedElementBy(deltaAngle: number) {
  const elementId = getSingleSelectedElementId();

  if (!elementId) {
    return false;
  }

  const element = sceneStore
    .get()
    .elements.find((item) => item.id === elementId);

  if (!element || element.type === "arrow") {
    return false;
  }

  historyStore.begin();
  sceneStore.updateById(elementId, (current) =>
    updateElement(current, {
      angle: getElementRotation(current) + deltaAngle,
    }),
  );
  historyStore.commit();

  return true;
}

/** Sets an exact angle for the single selected element. */
export function setSelectedElementRotation(angle: number) {
  const elementId = getSingleSelectedElementId();

  if (!elementId || !Number.isFinite(angle)) {
    return false;
  }

  const element = sceneStore
    .get()
    .elements.find((item) => item.id === elementId);

  if (!element || element.type === "arrow" || getElementRotation(element) === angle) {
    return false;
  }

  historyStore.begin();
  sceneStore.updateById(elementId, (current) => updateElement(current, { angle }));
  historyStore.commit();

  return true;
}

