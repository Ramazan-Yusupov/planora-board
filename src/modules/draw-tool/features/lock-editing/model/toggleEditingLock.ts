import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { editingLockStore } from "./editingLockStore";

/** Keeps the toolbar button and the keyboard shortcut behavior identical. */
export function toggleEditingLock() {
  if (!editingLockStore.get().isLocked) {
    if (document.activeElement instanceof HTMLTextAreaElement) {
      document.activeElement.blur();
    }

    selectionStore.clear();
    toolStore.set("pan");
    editingLockStore.lock();
    return;
  }

  editingLockStore.unlock();
  toolStore.set("selection");
}

