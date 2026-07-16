import type { SelectionState } from "../model/types";

export function isElementSelected(selection: SelectionState, elementId: string) {
  return selection.elementIds.includes(elementId);
}

