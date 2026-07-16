import type { PointerEvent as ReactPointerEvent } from "react";
import { hitTestElement } from "@/modules/draw-tool/entities/element";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { getWorldPointerPosition } from "@/modules/draw-tool/features/draw-shape/lib/getWorldPointerPosition";
import { copyElementStyle } from "./styleClipboardActions";

export function useEyedropper() {
  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0 || toolStore.get() !== "eyedropper") return;
    const point = getWorldPointerPosition(event);
    const target = [...sceneStore.get().elements].reverse().find((element) => hitTestElement(element, point));
    if (!target) return;
    copyElementStyle(target);
    selectionStore.setElementIds([target.id]);
    toolStore.set("selection");
  }
  return { onPointerDown };
}

