import { useCallback } from "react";
import { duplicateSelectedElements } from "./duplicateElements";

/** Stable callback for duplicate actions in panels and menus. */
export function useDuplicateElements() {
  return useCallback(() => duplicateSelectedElements(), []);
}

