import { getSelectableSceneElements, sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import type { Rect } from "@/modules/draw-tool/shared/types";
import { getElementsInSelectionBox } from "../lib/getElementsInSelectionBox";

export function selectByArea(selectionBox: Rect, append = false) {
  const elementIds = getElementsInSelectionBox(
    getSelectableSceneElements(sceneStore.get()),
    selectionBox,
  ).map((element) => element.id);

  selectionStore.setElementIds(
    append
      ? [...selectionStore.get().elementIds, ...elementIds]
      : elementIds,
  );
}

