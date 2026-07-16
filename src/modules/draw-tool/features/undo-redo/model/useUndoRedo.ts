import { useSyncExternalStore } from "react";
import { historyStore } from "@/modules/draw-tool/entities/history";

export function useUndoRedo() {
  const state = useSyncExternalStore(
    historyStore.subscribe,
    historyStore.get,
    historyStore.get,
  );

  return {
    ...state,
    redo: () => historyStore.redo(),
    undo: () => historyStore.undo(),
  };
}

