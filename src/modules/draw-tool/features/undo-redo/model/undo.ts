import { historyStore } from "@/modules/draw-tool/entities/history";

export function undo() {
  return historyStore.undo();
}

