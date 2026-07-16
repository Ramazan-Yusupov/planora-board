import { historyStore } from "@/modules/draw-tool/entities/history";

export function redo() {
  return historyStore.redo();
}

