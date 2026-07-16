import type { SelectionState } from "./types";

export function hasSingleSelection(selection: SelectionState) {
  return selection.elementIds.length === 1;
}

