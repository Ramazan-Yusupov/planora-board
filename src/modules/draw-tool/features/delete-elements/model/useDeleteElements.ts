import { useCallback } from "react";
import { deleteSelectedElements } from "./deleteElements";

/** Stable callback for delete buttons and keyboard-driven deletion. */
export function useDeleteElements() {
  return useCallback(() => deleteSelectedElements(), []);
}

