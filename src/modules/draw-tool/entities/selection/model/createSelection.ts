import type { SelectionState } from "./types";

export function createSelection(): SelectionState {
  return {
    elementIds: [],
    selectionBox: null,
  };
}

