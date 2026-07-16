import { createSelection } from "./createSelection";
import type { SelectionState } from "./types";

type SelectionListener = () => void;

let selection = createSelection();
const listeners = new Set<SelectionListener>();
const elementIdsListeners = new Set<SelectionListener>();
const selectionBoxListeners = new Set<SelectionListener>();

function notify(listenersToNotify: Set<SelectionListener>) {
  listenersToNotify.forEach((listener) => listener());
}

function notifyAllListeners() {
  listeners.forEach((listener) => listener());
}

function set(
  nextSelection: SelectionState,
  changedParts: {
    elementIds?: boolean;
    selectionBox?: boolean;
  },
) {
  selection = nextSelection;
  notifyAllListeners();

  if (changedParts.elementIds) {
    notify(elementIdsListeners);
  }

  if (changedParts.selectionBox) {
    notify(selectionBoxListeners);
  }
}

export const selectionStore = {
  get() {
    return selection;
  },

  setElementIds(elementIds: string[]) {
    set(
      { ...selection, elementIds: [...new Set(elementIds)], selectionBox: null },
      { elementIds: true, selectionBox: selection.selectionBox !== null },
    );
  },

  toggleElementId(elementId: string) {
    const isSelected = selection.elementIds.includes(elementId);
    this.setElementIds(
      isSelected
        ? selection.elementIds.filter((id) => id !== elementId)
        : [...selection.elementIds, elementId],
    );
  },

  setSelectionBox(selectionBox: SelectionState["selectionBox"]) {
    set({ ...selection, selectionBox }, { selectionBox: true });
  },

  clear() {
    set(createSelection(), {
      elementIds: selection.elementIds.length > 0,
      selectionBox: selection.selectionBox !== null,
    });
  },

  subscribe(listener: SelectionListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  subscribeElementIds(listener: SelectionListener) {
    elementIdsListeners.add(listener);
    return () => elementIdsListeners.delete(listener);
  },

  subscribeSelectionBox(listener: SelectionListener) {
    selectionBoxListeners.add(listener);
    return () => selectionBoxListeners.delete(listener);
  },
};

