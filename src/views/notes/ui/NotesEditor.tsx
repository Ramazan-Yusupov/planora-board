"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import {
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";

import type { Board } from "@/entities/board";
import {
  parseMarkdownBlocks,
  type NoteBlock,
} from "@/features/manage-notes";

import {
  NOTES_ROOT_DROP_ZONE_ID,
  applyInlineFormat,
  basicBlockCommands,
  clearEditableText,
  createBlock,
  getActiveInlineFormats,
  getActiveTaskCreateTargets,
  getBoardTaskItems,
  getInlineFormatShortcut,
  getInlineHtmlFromEditable,
  getNumberedListNumbers,
  getTableCellKey,
  getTableCells,
  getTaskTitleFromSlashText,
  getTextFromEditable,
  getVisibleBlocks,
  insertSoftBreakAtCaret,
  isDescendantBlock,
  isSelectionInsideElement,
  isTaskCreateQuery,
  type BlockCommand,
  type InlineFormat,
  type NoteDropTarget,
  type NoteTaskCreateTarget,
  type NoteTaskItem,
} from "../lib/notesEditorModel";
import { useNotesEditorFocus } from "../lib/useNotesEditorFocus";
import {
  NotesInlineFormatBubble,
  type InlineFormatMenuState,
} from "./NotesInlineFormatBubble";
import { NotesRootDropZone } from "./NotesRootDropZone";
import { NotesSortableBlock } from "./NotesSortableBlock";
import type { TableCellAction } from "./NotesTableCell";
type NotesEditorProps = Readonly<{
  activeBoard: Board;
  blocks: readonly NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  onCreateTask: (listId: string, title: string) => NoteTaskItem | null;
  onOpenCard: (cardId: string) => void;
}>;

type SlashMenuState = Readonly<{
  blockId: string;
  query: string;
}> | null;

type BlockActionMenuState = Readonly<{
  blockId: string;
}> | null;

type TableCellMenuState = Readonly<{
  blockId: string;
  cellIndex: number;
  rowIndex: number;
}> | null;

function filterBlockCommands(query: string): readonly BlockCommand[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return basicBlockCommands;
  }

  return basicBlockCommands.filter((command) => {
    const haystack = [
      command.title,
      command.description,
      command.shortcut ?? "",
      command.id,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function NotesEditor({
  activeBoard,
  blocks,
  onChange,
  onCreateTask,
  onOpenCard,
}: NotesEditorProps) {
  const { blockRefs, focusBlock, focusTableCell, tableCellRefs } =
    useNotesEditorFocus(blocks);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>(null);
  const [actionMenu, setActionMenu] = useState<BlockActionMenuState>(null);
  const [tableCellMenu, setTableCellMenu] = useState<TableCellMenuState>(null);
  const [inlineMenu, setInlineMenu] = useState<InlineFormatMenuState>(null);
  const [activeDragBlockId, setActiveDragBlockId] = useState<string | null>(
    null,
  );
  const [dropTarget, setDropTarget] = useState<NoteDropTarget>(null);
  const visibleCommands = filterBlockCommands(slashMenu?.query ?? "");
  const visibleTaskCreateTargets = isTaskCreateQuery(slashMenu?.query ?? "")
    ? getActiveTaskCreateTargets(activeBoard)
    : [];
  const visibleBlocks = useMemo(() => getVisibleBlocks(blocks), [blocks]);
  const taskItems = useMemo(() => getBoardTaskItems(activeBoard), [activeBoard]);
  const numberedListNumbers = useMemo(
    () => getNumberedListNumbers(visibleBlocks),
    [visibleBlocks],
  );

  const closeSlashMenu = () => setSlashMenu(null);
  const closeActionMenu = () => setActionMenu(null);
  const closeTableCellMenu = () => setTableCellMenu(null);
  const closeInlineMenu = () => setInlineMenu(null);

  const getDropTarget = (
    activeBlockId: string,
    overId: string | null,
  ): NoteDropTarget => {
    if (!overId || activeBlockId === overId) {
      return null;
    }

    const activeBlock = blocks.find((block) => block.id === activeBlockId);

    if (!activeBlock) {
      return null;
    }

    if (overId === NOTES_ROOT_DROP_ZONE_ID) {
      return activeBlock.parentId ? { type: "root" } : null;
    }

    const overBlock = blocks.find((block) => block.id === overId);

    if (!overBlock) {
      return null;
    }

    if (isDescendantBlock(overBlock, activeBlock.id, blocks)) {
      return null;
    }

    if (overBlock.type === "toggle" && activeBlock.parentId !== overBlock.id) {
      return { blockId: overBlock.id, type: "nest" };
    }

    return { blockId: overBlock.id, type: "line" };
  };

  const updateInlineMenu = (block: NoteBlock, element: HTMLElement) => {
    const selection = window.getSelection();

    if (!isSelectionInsideElement(selection, element)) {
      closeInlineMenu();
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();

    if (!rect.width && !rect.height) {
      closeInlineMenu();
      return;
    }

    const menuWidth = 184;
    const margin = 8;
    const left = Math.min(
      Math.max(margin, rect.left + rect.width / 2 - menuWidth / 2),
      window.innerWidth - menuWidth - margin,
    );
    const top = Math.max(margin, rect.top - 46);

    setInlineMenu({
      blockId: block.id,
      left,
      top,
      activeFormats: getActiveInlineFormats(element),
    });
  };

  const updateBlock = (blockId: string, patch: Partial<NoteBlock>) => {
    onChange(
      blocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block,
      ),
    );
  };

  const syncInlineBlock = (blockId: string, element: HTMLElement) => {
    updateBlock(blockId, {
      html: getInlineHtmlFromEditable(element),
      text: getTextFromEditable(element),
    });
  };

  const applyInlineFormatToCurrentSelection = (format: InlineFormat) => {
    const blockId = inlineMenu?.blockId;
    const element = blockId ? blockRefs.current.get(blockId) : undefined;
    const block = blockId ? blocks.find((current) => current.id === blockId) : undefined;

    if (!blockId || !element || !block) {
      closeInlineMenu();
      return;
    }

    element.focus();
    applyInlineFormat(format, element);
    syncInlineBlock(blockId, element);
    updateInlineMenu(block, element);
  };

  const insertBlockAfter = (
    blockId: string,
    nextBlock: NoteBlock = createBlock(),
  ) => {
    const index = blocks.findIndex((block) => block.id === blockId);
    const childIndexes =
      nextBlock.parentId === blockId
        ? blocks
            .map((block, blockIndex) =>
              block.parentId === blockId ? blockIndex : -1,
            )
            .filter((blockIndex) => blockIndex >= 0)
        : [];
    const insertIndex =
      childIndexes.length > 0 ? Math.max(...childIndexes) : index;
    const nextBlocks = [...blocks];

    if (nextBlock.parentId === blockId && index >= 0) {
      nextBlocks[index] = {
        ...nextBlocks[index],
        collapsed: false,
      };
    }

    nextBlocks.splice(insertIndex + 1, 0, nextBlock);
    focusBlock(nextBlock.id);
    onChange(nextBlocks);
  };

  const createContinuationBlock = (block: NoteBlock): NoteBlock => {
    if (block.type === "toggle") {
      return createBlock("paragraph", "", block.id);
    }

    if (
      block.type === "numbered" ||
      block.type === "bulleted" ||
      block.type === "quote"
    ) {
      return createBlock(block.type, "", block.parentId);
    }

    if (block.type === "todo") {
      return createBlock("todo", "", block.parentId);
    }

    return createBlock("paragraph", "", block.parentId);
  };

  const removeBlock = (blockId: string) => {
    if (blocks.length <= 1) {
      updateBlock(blockId, {
        checked: false,
        html: undefined,
        text: "",
        type: "paragraph",
      });
      return;
    }

    const index = blocks.findIndex((block) => block.id === blockId);
    const nextBlocks = blocks.filter((block) => block.id !== blockId);
    const focusTarget = nextBlocks[Math.max(0, index - 1)];

    if (focusTarget) {
      focusBlock(focusTarget.id);
    }

    onChange(nextBlocks);
  };

  const updateTableCell = (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    value: string,
  ) => {
    onChange(
      blocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        const tableCells = getTableCells(block);
        tableCells[rowIndex][cellIndex] = value;

        return {
          ...block,
          tableCells,
        };
      }),
    );
  };

  const applyTableCellAction = (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    action: TableCellAction,
  ) => {
    closeTableCellMenu();

    onChange(
      blocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        const tableCells = getTableCells(block);
        const rowCount = tableCells.length;
        const columnCount = tableCells[0]?.length ?? 1;

        if (action === "toggle-header-row") {
          focusTableCell(blockId, rowIndex, cellIndex);
          return {
            ...block,
            tableHasHeaderRow: !(block.tableHasHeaderRow ?? true),
            tableCells,
          };
        }

        if (action === "insert-row-above" || action === "insert-row-below") {
          const insertIndex =
            action === "insert-row-above" ? rowIndex : rowIndex + 1;
          const nextTableCells = [...tableCells];
          nextTableCells.splice(insertIndex, 0, Array(columnCount).fill(""));
          focusTableCell(blockId, insertIndex, cellIndex);

          return {
            ...block,
            tableCells: nextTableCells,
          };
        }

        if (action === "delete-row") {
          if (rowCount <= 1) {
            return block;
          }

          const nextTableCells = tableCells.filter(
            (_, currentRowIndex) => currentRowIndex !== rowIndex,
          );
          focusTableCell(
            blockId,
            Math.min(rowIndex, nextTableCells.length - 1),
            Math.min(cellIndex, columnCount - 1),
          );

          return {
            ...block,
            tableCells: nextTableCells,
          };
        }

        if (
          action === "insert-column-left" ||
          action === "insert-column-right"
        ) {
          const insertIndex =
            action === "insert-column-left" ? cellIndex : cellIndex + 1;
          const nextTableCells = tableCells.map((row) => {
            const nextRow = [...row];
            nextRow.splice(insertIndex, 0, "");
            return nextRow;
          });
          focusTableCell(blockId, rowIndex, insertIndex);

          return {
            ...block,
            tableCells: nextTableCells,
          };
        }

        if (action === "delete-column") {
          if (columnCount <= 1) {
            return block;
          }

          const nextTableCells = tableCells.map((row) =>
            row.filter((_, currentCellIndex) => currentCellIndex !== cellIndex),
          );
          focusTableCell(
            blockId,
            rowIndex,
            Math.min(cellIndex, columnCount - 2),
          );

          return {
            ...block,
            tableCells: nextTableCells,
          };
        }

        return block;
      }),
    );
  };

  const handleTableCellKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    block: NoteBlock,
    rowIndex: number,
    cellIndex: number,
  ) => {
    if (event.key === "Escape") {
      closeTableCellMenu();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    const tableCells = getTableCells(block);
    const rowCount = tableCells.length;
    const columnCount = tableCells[0]?.length ?? 1;

    if (event.shiftKey) {
      if (rowIndex === 0 && cellIndex === 0) {
        return;
      }

      if (cellIndex > 0) {
        focusTableCell(block.id, rowIndex, cellIndex - 1);
        return;
      }

      focusTableCell(block.id, rowIndex - 1, columnCount - 1);
      return;
    }

    if (cellIndex < columnCount - 1) {
      focusTableCell(block.id, rowIndex, cellIndex + 1);
      return;
    }

    if (rowIndex < rowCount - 1) {
      focusTableCell(block.id, rowIndex + 1, 0);
      return;
    }

    applyTableCellAction(block.id, rowIndex, cellIndex, "insert-row-below");
  };

  const applyBlockCommand = (block: NoteBlock, command: BlockCommand) => {
    const element = blockRefs.current.get(block.id);
    const currentText = element ? getTextFromEditable(element) : block.text;
    const currentHtml = element
      ? getInlineHtmlFromEditable(element)
      : block.html;
    const shouldClearText =
      currentText.startsWith("/") || command.id === "divider";
    const nextText = shouldClearText ? "" : currentText;
    const nextBlocks = blocks.map((current) =>
      current.id === block.id
        ? {
            ...current,
            checked: command.id === "todo" ? false : undefined,
            collapsed: command.id === "toggle" ? false : undefined,
            html:
              shouldClearText || command.id === "table"
                ? undefined
                : currentHtml,
            tableHasHeaderRow: command.id === "table" ? true : undefined,
            tableCells:
              command.id === "table"
                ? getTableCells({ ...current, tableCells: undefined })
                : undefined,
            text: command.id === "table" ? "" : nextText,
            type: command.id,
          }
        : current,
    );

    if (element && shouldClearText) {
      clearEditableText(element);
    }

    if (command.id === "divider") {
      const index = nextBlocks.findIndex((current) => current.id === block.id);
      const nextBlock = createBlock();
      const withInserted = [...nextBlocks];
      withInserted.splice(index + 1, 0, nextBlock);
      focusBlock(nextBlock.id);
      onChange(withInserted);
      closeSlashMenu();
      return;
    }

    focusBlock(block.id);
    onChange(nextBlocks);
    closeSlashMenu();
  };

  const applyTaskLink = (block: NoteBlock, task: NoteTaskItem) => {
    const element = blockRefs.current.get(block.id);
    const nextBlocks = blocks.map((current) =>
      current.id === block.id
        ? {
            ...current,
            checked: undefined,
            collapsed: undefined,
            html: undefined,
            linkedBoardId: task.boardId,
            linkedCardId: task.card.id,
            tableCells: undefined,
            tableHasHeaderRow: undefined,
            text: task.card.title,
            type: "linked-card" as const,
          }
        : current,
    );

    if (element) {
      clearEditableText(element);
    }

    onChange(nextBlocks);
    closeSlashMenu();
    closeInlineMenu();
  };

  const applyTaskCreate = (
    block: NoteBlock,
    target: NoteTaskCreateTarget,
  ) => {
    if (target.isDisabled) {
      return;
    }

    const element = blockRefs.current.get(block.id);
    const currentText = element ? getTextFromEditable(element) : block.text;
    const taskTitle = getTaskTitleFromSlashText(currentText);
    const task = onCreateTask(target.listId, taskTitle);

    if (!task) {
      return;
    }

    applyTaskLink(block, task);
  };

  const handleShortcut = (
    block: NoteBlock,
    text: string,
    element: HTMLElement,
  ): boolean => {
    if (text === "#") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "heading1" });
      return true;
    }

    if (text === "##") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "heading2" });
      return true;
    }

    if (text === "###") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "heading3" });
      return true;
    }

    if (text === "####") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "heading4" });
      return true;
    }

    if (text === "-") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "bulleted" });
      return true;
    }

    if (/^\d+\.$/.test(text)) {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "numbered" });
      return true;
    }

    if (text === "[]" || text === "[ ]") {
      clearEditableText(element);
      updateBlock(block.id, {
        checked: false,
        html: undefined,
        text: "",
        type: "todo",
      });
      return true;
    }

    if (text === ">") {
      clearEditableText(element);
      updateBlock(block.id, {
        collapsed: false,
        html: undefined,
        text: "",
        type: "toggle",
      });
      return true;
    }

    if (text === "\"") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "quote" });
      return true;
    }

    if (text === "```") {
      clearEditableText(element);
      updateBlock(block.id, { html: undefined, text: "", type: "code" });
      return true;
    }

    if (text === "---") {
      clearEditableText(element);
      const nextBlock = createBlock();
      const nextBlocks = blocks.map((current) =>
        current.id === block.id
          ? { ...current, html: undefined, text: "", type: "divider" as const }
          : current,
      );
      const index = nextBlocks.findIndex((current) => current.id === block.id);
      const withInserted = [...nextBlocks];
      withInserted.splice(index + 1, 0, nextBlock);
      focusBlock(nextBlock.id);
      onChange(withInserted);
      return true;
    }

    return false;
  };

  const handleInput = (block: NoteBlock, element: HTMLElement) => {
    const text = getTextFromEditable(element);
    updateBlock(block.id, {
      html: getInlineHtmlFromEditable(element),
      text,
    });

    if (text.startsWith("/")) {
      setSlashMenu({
        blockId: block.id,
        query: text.slice(1),
      });
      closeActionMenu();
      closeTableCellMenu();
      closeInlineMenu();
      return;
    }

    if (slashMenu?.blockId === block.id) {
      closeSlashMenu();
    }
  };

  const shouldParseMarkdownPaste = (text: string): boolean => {
    const trimmed = text.trim();

    if (!trimmed) {
      return false;
    }

    return (
      trimmed.includes("\n") ||
      /^(#{1,4}\s|-\s|- \[[ xX]\]\s|\d+\.\s|>\s|```|---$|\|.+\|$)/.test(
        trimmed,
      )
    );
  };

  const handleMarkdownPaste = (
    block: NoteBlock,
    text: string,
    element: HTMLElement,
  ): boolean => {
    if (block.type === "code" || !shouldParseMarkdownPaste(text)) {
      return false;
    }

    const pastedBlocks = parseMarkdownBlocks(text).map((pastedBlock) => ({
      ...pastedBlock,
      boardId: block.boardId,
      parentId: pastedBlock.parentId ?? block.parentId,
    }));

    if (pastedBlocks.length === 0) {
      return false;
    }

    const currentText = getTextFromEditable(element).trim();
    const blockIndex = blocks.findIndex((current) => current.id === block.id);

    if (blockIndex < 0) {
      return false;
    }

    closeSlashMenu();
    closeActionMenu();
    closeTableCellMenu();
    closeInlineMenu();

    if (!currentText || currentText === "/") {
      const [firstPastedBlock, ...restPastedBlocks] = pastedBlocks;

      if (!firstPastedBlock) {
        return false;
      }

      const nextBlocks = [...blocks];
      nextBlocks[blockIndex] = {
        ...firstPastedBlock,
        id: block.id,
        parentId: block.parentId,
      };
      nextBlocks.splice(blockIndex + 1, 0, ...restPastedBlocks);
      clearEditableText(element);
      focusBlock(restPastedBlocks.at(-1)?.id ?? block.id);
      onChange(nextBlocks);
      return true;
    }

    const nextBlocks = [...blocks];
    nextBlocks.splice(blockIndex + 1, 0, ...pastedBlocks);
    focusBlock(pastedBlocks.at(-1)?.id ?? block.id);
    onChange(nextBlocks);
    return true;
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    block: NoteBlock,
  ) => {
    const text = getTextFromEditable(event.currentTarget);
    const isCurrentMenuOpen = slashMenu?.blockId === block.id;
    const inlineShortcut = getInlineFormatShortcut(event);

    if (inlineShortcut && block.type !== "code") {
      event.preventDefault();
      applyInlineFormat(inlineShortcut, event.currentTarget);
      syncInlineBlock(block.id, event.currentTarget);
      updateInlineMenu(block, event.currentTarget);
      return;
    }

    if (event.key === "Escape" && inlineMenu?.blockId === block.id) {
      event.preventDefault();
      closeInlineMenu();
      return;
    }

    if (event.key === "Escape" && isCurrentMenuOpen) {
      event.preventDefault();
      closeSlashMenu();
      closeInlineMenu();
      return;
    }

    if (
      isCurrentMenuOpen &&
      (event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "PageDown" ||
        event.key === "PageUp" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === "Enter")
    ) {
      event.preventDefault();
      return;
    }

    if (event.key === " " && handleShortcut(block, text, event.currentTarget)) {
      event.preventDefault();
      return;
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      const element = event.currentTarget;
      insertSoftBreakAtCaret();
      updateBlock(block.id, {
        html: getInlineHtmlFromEditable(element),
        text: getTextFromEditable(element),
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (
        !text &&
        (block.type === "numbered" ||
          block.type === "bulleted" ||
          block.type === "todo" ||
          block.type === "quote")
      ) {
        updateBlock(block.id, {
          checked: false,
          html: undefined,
          text: "",
          type: "paragraph",
        });
        return;
      }

      if (text === "---") {
        const nextBlock = createBlock();
        const nextBlocks = blocks.map((current) =>
          current.id === block.id
            ? { ...current, html: undefined, text: "", type: "divider" as const }
            : current,
        );
        const index = nextBlocks.findIndex(
          (current) => current.id === block.id,
        );
        const withInserted = [...nextBlocks];
        withInserted.splice(index + 1, 0, nextBlock);
        focusBlock(nextBlock.id);
        onChange(withInserted);
        return;
      }

      insertBlockAfter(block.id, createContinuationBlock(block));
      return;
    }

    if (event.key === "Backspace" && !text && block.type !== "paragraph") {
      event.preventDefault();
      updateBlock(block.id, {
        checked: false,
        html: undefined,
        text: "",
        type: "paragraph",
      });
      return;
    }

    if (event.key === "Backspace" && !text) {
      event.preventDefault();
      removeBlock(block.id);
    }
  };

  const resetDragState = () => {
    setActiveDragBlockId(null);
    setDropTarget(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragBlockId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setDropTarget(getDropTarget(activeId, overId));
  };

  const handleDragCancel = () => {
    resetDragState();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    const target = getDropTarget(activeId, overId);
    resetDragState();

    if (!overId || activeId === overId || !target) {
      return;
    }

    closeSlashMenu();
    closeActionMenu();
    closeTableCellMenu();
    closeInlineMenu();

    const activeBlock = blocks.find((block) => block.id === activeId);
    const overBlock = blocks.find((block) => block.id === overId);
    const oldIndex = blocks.findIndex((block) => block.id === activeId);
    const newIndex = blocks.findIndex((block) => block.id === overId);

    if (!activeBlock || !overBlock || oldIndex < 0 || newIndex < 0) {
      if (target.type === "root" && activeBlock && oldIndex >= 0) {
        const withoutActive = blocks.filter((block) => block.id !== activeId);
        const lastRootIndex = withoutActive.reduce(
          (lastIndex, block, index) => (!block.parentId ? index : lastIndex),
          -1,
        );
        const movedBlock = { ...activeBlock, parentId: undefined };
        const nextBlocks = [...withoutActive];
        nextBlocks.splice(lastRootIndex + 1, 0, movedBlock);
        onChange(nextBlocks);
      }

      return;
    }

    if (target.type === "root") {
      const withoutActive = blocks.filter((block) => block.id !== activeId);
      const lastRootIndex = withoutActive.reduce(
        (lastIndex, block, index) => (!block.parentId ? index : lastIndex),
        -1,
      );
      const movedBlock = {
        ...activeBlock,
        parentId: undefined,
      };
      const nextBlocks = [...withoutActive];
      nextBlocks.splice(lastRootIndex + 1, 0, movedBlock);
      onChange(nextBlocks);
      return;
    }

    if (
      target.type === "nest" &&
      overBlock.type === "toggle" &&
      activeBlock.parentId !== overBlock.id
    ) {
      if (overBlock.parentId === activeBlock.id) {
        return;
      }

      const withoutActive = blocks.filter((block) => block.id !== activeId);
      const toggleIndex = withoutActive.findIndex(
        (block) => block.id === overBlock.id,
      );
      const childIndexes = withoutActive
        .map((block, index) => (block.parentId === overBlock.id ? index : -1))
        .filter((index) => index >= 0);
      const insertIndex =
        childIndexes.length > 0 ? Math.max(...childIndexes) : toggleIndex;
      const movedBlock = {
        ...activeBlock,
        parentId: overBlock.id,
      };
      const nextBlocks = withoutActive.map((block) =>
        block.id === overBlock.id ? { ...block, collapsed: false } : block,
      );
      nextBlocks.splice(insertIndex + 1, 0, movedBlock);
      onChange(nextBlocks);
      return;
    }

    if (activeBlock.parentId !== overBlock.parentId) {
      const withoutActive = blocks.filter((block) => block.id !== activeId);
      const targetIndex = withoutActive.findIndex(
        (block) => block.id === overBlock.id,
      );

      if (targetIndex < 0) {
        return;
      }

      withoutActive.splice(targetIndex, 0, {
        ...activeBlock,
        parentId: overBlock.parentId,
      });
      onChange(withoutActive);
      return;
    }

    onChange(arrayMove([...blocks], oldIndex, newIndex));
  };
  const lastBlock = visibleBlocks[visibleBlocks.length - 1];
  const activeDragBlock = activeDragBlockId
    ? blocks.find((block) => block.id === activeDragBlockId)
    : undefined;
  const isDraggingNestedBlock = Boolean(activeDragBlock?.parentId);

  return (
    <div className="mx-auto min-h-full w-full max-w-3xl px-4 py-8 sm:px-8">
      <DndContext
        collisionDetection={closestCenter}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
      >
        <SortableContext
          items={visibleBlocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            <NotesRootDropZone isDraggingNestedBlock={isDraggingNestedBlock} />
            {visibleBlocks.map((block) => (
              <NotesSortableBlock
                key={block.id}
                block={block}
                dropIntent={
                  dropTarget?.type !== "root" && dropTarget?.blockId === block.id
                    ? dropTarget
                    : null
                }
                isNested={Boolean(block.parentId)}
                isActionMenuOpen={actionMenu?.blockId === block.id}
                isSlashMenuOpen={slashMenu?.blockId === block.id}
                openTableCellMenu={tableCellMenu}
                menuCommands={visibleCommands}
                numberedListNumber={numberedListNumbers.get(block.id)}
                showTaskCreateSection={isTaskCreateQuery(slashMenu?.query ?? "")}
                taskCreateTargets={visibleTaskCreateTargets}
                taskItems={taskItems}
                onBlur={(currentBlock, element) =>
                  updateBlock(currentBlock.id, {
                    html: getInlineHtmlFromEditable(element),
                    text: getTextFromEditable(element),
                  })
                }
                onCloseActionMenu={closeActionMenu}
                onCloseSlashMenu={closeSlashMenu}
                onCloseTableCellMenu={closeTableCellMenu}
                onDeleteBlock={removeBlock}
                onInput={handleInput}
                onInsertAfter={insertBlockAfter}
                onKeyDown={handleKeyDown}
                onPasteMarkdown={handleMarkdownPaste}
                onOpenActionMenu={(blockId) => {
                  closeSlashMenu();
                  closeTableCellMenu();
                  closeInlineMenu();
                  setActionMenu({ blockId });
                }}
                onOpenTableCellMenu={(blockId, rowIndex, cellIndex) => {
                  closeSlashMenu();
                  closeActionMenu();
                  closeInlineMenu();
                  setTableCellMenu({ blockId, rowIndex, cellIndex });
                }}
                onRegisterElement={(blockId, element) => {
                  if (element) {
                    blockRefs.current.set(blockId, element);
                  } else {
                    blockRefs.current.delete(blockId);
                  }
                }}
                onRegisterTableCell={(blockId, rowIndex, cellIndex, element) => {
                  const key = getTableCellKey(blockId, rowIndex, cellIndex);

                  if (element) {
                    tableCellRefs.current.set(key, element);
                  } else {
                    tableCellRefs.current.delete(key);
                  }
                }}
                onSetBlockColor={(blockId, patch) =>
                  updateBlock(blockId, patch)
                }
                onCreateTask={applyTaskCreate}
                onSelectionChange={(currentBlock, element) => {
                  if (currentBlock.type === "code") {
                    closeInlineMenu();
                    return;
                  }

                  updateInlineMenu(currentBlock, element);
                }}
                onSelectCommand={applyBlockCommand}
                onSelectTask={applyTaskLink}
                onOpenLinkedCard={(currentBlock) => {
                  if (currentBlock.linkedCardId) {
                    onOpenCard(currentBlock.linkedCardId);
                  }
                }}
                onTableCellAction={applyTableCellAction}
                onTableCellKeyDown={handleTableCellKeyDown}
                onToggleCollapsed={(currentBlock) =>
                  updateBlock(currentBlock.id, {
                    collapsed: !currentBlock.collapsed,
                  })
                }
                onToggleTodo={(currentBlock) =>
                  updateBlock(currentBlock.id, {
                    checked: !currentBlock.checked,
                  })
                }
                onUpdateTableCell={updateTableCell}
              />
            ))}
            {lastBlock ? (
              <button
                className="ml-26 mt-2 inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-text-muted transition hover:bg-white/8 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                onClick={() => insertBlockAfter(lastBlock.id)}
              >
                <Plus aria-hidden="true" size={16} />
                Новая строка
              </button>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>
      <NotesInlineFormatBubble
        menu={inlineMenu}
        onFormat={applyInlineFormatToCurrentSelection}
      />
    </div>
  );
}


