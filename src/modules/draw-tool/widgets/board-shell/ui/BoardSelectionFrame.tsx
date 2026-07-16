import { useSyncExternalStore } from "react";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { viewportStore, worldToScreen } from "@/modules/draw-tool/entities/viewport";
import { SelectionFrame } from "./SelectionFrame";

export function BoardSelectionFrame() {
  const selectionBox = useSyncExternalStore(
    selectionStore.subscribeSelectionBox,
    () => selectionStore.get().selectionBox,
    () => selectionStore.get().selectionBox,
  );

  const viewport = useSyncExternalStore(
    viewportStore.subscribe,
    viewportStore.get,
    viewportStore.get,
  );

  if (!selectionBox) {
    return null;
  }

  const origin = worldToScreen(
    { x: selectionBox.x, y: selectionBox.y },
    viewport,
  );

  return (
    <SelectionFrame
      className="border-dashed border-accent bg-accent/10"
      rect={{
        ...origin,
        height: selectionBox.height * viewport.zoom,
        width: selectionBox.width * viewport.zoom,
      }}
    />
  );
}

