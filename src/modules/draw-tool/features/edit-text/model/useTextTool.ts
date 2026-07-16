import type { PointerEvent as ReactPointerEvent } from "react";
import { createText, getTextSize, updateElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { findContainingFrame, sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { toolSettingsStore } from "@/modules/draw-tool/features/change-style";
import { snapPointToGrid } from "@/modules/draw-tool/shared/lib/math/snapPointToGrid";
import { getWorldPointerPosition } from "@/modules/draw-tool/features/draw-shape/lib/getWorldPointerPosition";
import { textEditorStore } from "./textEditorStore";

export function useTextTool() {
  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) {
      return;
    }

    const settings = toolSettingsStore.get("text");
    const worldPoint = getWorldPointerPosition(event);
    const point = settings.snapToGrid
      ? snapPointToGrid(worldPoint, settings.snapSize)
      : worldPoint;
    const size = getTextSize(" ", settings.fontSize, settings.fontFamily);

    historyStore.begin();
    const element = createText({
      x: point.x,
      y: point.y,
      width: size.width,
      height: size.height,
      style: settings.style,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      textAlign: settings.textAlign,
    });

    sceneStore.add(element);

    // Remember the Frame at the moment the text is created. The Frame can then
    // grow with the text while it is being typed instead of clipping it.
    const parentFrame = findContainingFrame(element, sceneStore.get().elements);
    if (parentFrame) {
      sceneStore.updateById(element.id, (current) =>
        updateElement(current, { parentId: parentFrame.id }),
      );
    }

    selectionStore.setElementIds([element.id]);
    textEditorStore.open(element.id, true);
  }

  return { onPointerDown };
}

