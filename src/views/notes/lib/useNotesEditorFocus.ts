import { useEffect, useRef } from "react";

import { getTableCellKey, placeCaretAtEnd } from "./notesEditorModel";

type PendingTableCellFocus = Readonly<{
  blockId: string;
  rowIndex: number;
  cellIndex: number;
}>;

export function useNotesEditorFocus(blocks: readonly unknown[]) {
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const tableCellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pendingFocusIdRef = useRef<string | null>(null);
  const pendingTableCellFocusRef = useRef<PendingTableCellFocus | null>(null);

  useEffect(() => {
    const pendingFocusId = pendingFocusIdRef.current;

    if (!pendingFocusId) {
      return;
    }

    pendingFocusIdRef.current = null;
    const element = blockRefs.current.get(pendingFocusId);

    if (!element) {
      return;
    }

    element.focus();
    placeCaretAtEnd(element);
  }, [blocks]);

  useEffect(() => {
    const pendingFocus = pendingTableCellFocusRef.current;

    if (!pendingFocus) {
      return;
    }

    pendingTableCellFocusRef.current = null;
    const element = tableCellRefs.current.get(
      getTableCellKey(
        pendingFocus.blockId,
        pendingFocus.rowIndex,
        pendingFocus.cellIndex,
      ),
    );

    if (!element) {
      return;
    }

    element.focus();
    placeCaretAtEnd(element);
  }, [blocks]);

  const focusBlock = (blockId: string) => {
    pendingFocusIdRef.current = blockId;
  };

  const focusTableCell = (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
  ) => {
    pendingTableCellFocusRef.current = { blockId, rowIndex, cellIndex };
  };

  return {
    blockRefs,
    focusBlock,
    focusTableCell,
    tableCellRefs,
  };
}
