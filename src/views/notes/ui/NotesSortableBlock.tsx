"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  Check,
  GripVertical,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useRef, type KeyboardEvent } from "react";

import type { NoteBlock } from "@/features/manage-notes";
import { cn } from "@/shared/lib";

import {
  DEFAULT_TABLE_COLUMN_COUNT,
  filterTaskItems,
  getBlockClassName,
  getBlockColorClassName,
  getBlockStyle,
  getTableCells,
  type BlockCommand,
  type NoteDropIntent,
  type NoteTaskCreateTarget,
  type NoteTaskItem,
} from "../lib/notesEditorModel";
import { NotesBlockActionMenu } from "./NotesBlockActionMenu";
import { NotesBlockCommandMenu } from "./NotesBlockCommandMenu";
import { NotesEditableBlock } from "./NotesEditableBlock";
import { NotesTableCell, type TableCellAction } from "./NotesTableCell";

type TableCellMenuState = Readonly<{
  blockId: string;
  cellIndex: number;
  rowIndex: number;
}> | null;

type NotesSortableBlockProps = Readonly<{
  block: NoteBlock;
  dropIntent: NoteDropIntent | null;
  isNested: boolean;
  isActionMenuOpen: boolean;
  isSlashMenuOpen: boolean;
  openTableCellMenu: TableCellMenuState;
  menuCommands: readonly BlockCommand[];
  numberedListNumber: number | undefined;
  showTaskCreateSection: boolean;
  taskCreateTargets: readonly NoteTaskCreateTarget[];
  taskItems: readonly NoteTaskItem[];
  onBlur: (block: NoteBlock, element: HTMLElement) => void;
  onCloseTableCellMenu: () => void;
  onDeleteBlock: (blockId: string) => void;
  onInput: (block: NoteBlock, element: HTMLElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>, block: NoteBlock) => void;
  onPasteMarkdown: (
    block: NoteBlock,
    text: string,
    element: HTMLElement,
  ) => boolean;
  onOpenActionMenu: (blockId: string) => void;
  onOpenTableCellMenu: (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
  ) => void;
  onCloseActionMenu: () => void;
  onCloseSlashMenu: () => void;
  onInsertAfter: (blockId: string) => void;
  onRegisterElement: (blockId: string, element: HTMLElement | null) => void;
  onRegisterTableCell: (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    element: HTMLElement | null,
  ) => void;
  onSelectionChange: (block: NoteBlock, element: HTMLElement) => void;
  onSetBlockColor: (
    blockId: string,
    patch: Pick<NoteBlock, "backgroundColor" | "textColor">,
  ) => void;
  onCreateTask: (block: NoteBlock, target: NoteTaskCreateTarget) => void;
  onSelectCommand: (block: NoteBlock, command: BlockCommand) => void;
  onSelectTask: (block: NoteBlock, task: NoteTaskItem) => void;
  onOpenLinkedCard: (block: NoteBlock) => void;
  onTableCellAction: (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    action: TableCellAction,
  ) => void;
  onTableCellKeyDown: (
    event: KeyboardEvent<HTMLElement>,
    block: NoteBlock,
    rowIndex: number,
    cellIndex: number,
  ) => void;
  onToggleCollapsed: (block: NoteBlock) => void;
  onToggleTodo: (block: NoteBlock) => void;
  onUpdateTableCell: (
    blockId: string,
    rowIndex: number,
    cellIndex: number,
    value: string,
  ) => void;
}>;

export function NotesSortableBlock({
  block,
  dropIntent,
  isNested,
  isActionMenuOpen,
  isSlashMenuOpen,
  openTableCellMenu,
  menuCommands,
  numberedListNumber,
  showTaskCreateSection,
  taskCreateTargets,
  taskItems,
  onBlur,
  onCloseTableCellMenu,
  onDeleteBlock,
  onInput,
  onKeyDown,
  onPasteMarkdown,
  onOpenActionMenu,
  onOpenTableCellMenu,
  onCloseActionMenu,
  onCloseSlashMenu,
  onInsertAfter,
  onRegisterElement,
  onRegisterTableCell,
  onSelectionChange,
  onSetBlockColor,
  onCreateTask,
  onSelectCommand,
  onSelectTask,
  onOpenLinkedCard,
  onTableCellAction,
  onTableCellKeyDown,
  onToggleCollapsed,
  onToggleTodo,
  onUpdateTableCell,
}: NotesSortableBlockProps) {
  const blockElementRef = useRef<HTMLDivElement | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      blockId: block.id,
      blockType: block.type,
      parentId: block.parentId,
      type: "note-block",
    },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const tableCells = block.type === "table" ? getTableCells(block) : [];
  const tableColumnCount =
    tableCells[0]?.length ?? DEFAULT_TABLE_COLUMN_COUNT;
  const tableHasHeaderRow = block.tableHasHeaderRow ?? true;
  const linkedTask = block.linkedCardId
    ? taskItems.find((task) => task.card.id === block.linkedCardId)
    : undefined;

  const registerBlockElement = (element: HTMLDivElement | null) => {
    blockElementRef.current = element;
    setNodeRef(element);
  };

  if (block.type === "divider") {
    return (
      <div
        ref={registerBlockElement}
        style={style}
        className={cn(
          "group relative flex items-center gap-1 py-3",
          isNested && "ml-12 border-l border-white/10 pl-3",
          isDragging && "opacity-35",
          dropIntent?.type === "nest" &&
            "rounded-lg bg-accent/10 ring-1 ring-accent/45",
        )}
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenActionMenu(block.id);
        }}
      >
        {dropIntent?.type === "line" ? (
          <span className="absolute -top-1 left-10 right-0 h-0.5 rounded-full bg-accent shadow-[0_0_12px_rgb(59_130_246/_70%)]" />
        ) : null}
        <button
          aria-label="Добавить строку ниже"
          className="grid size-7 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
          type="button"
          onClick={() => onInsertAfter(block.id)}
        >
          <Plus aria-hidden="true" size={16} />
        </button>
        <button
          aria-label="Открыть меню блока"
          className="grid size-7 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
          type="button"
          onClick={() => onOpenActionMenu(block.id)}
        >
          <MoreHorizontal aria-hidden="true" size={16} />
        </button>
        <button
          {...attributes}
          {...listeners}
          aria-label="Переместить блок"
          className="grid size-7 touch-none place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
          type="button"
        >
          <GripVertical aria-hidden="true" size={16} />
        </button>
        <button
          className="h-px min-w-0 flex-1 bg-white/16 transition hover:bg-white/30"
          type="button"
          onClick={() => onInsertAfter(block.id)}
        />
        {isActionMenuOpen ? (
          <NotesBlockActionMenu
            block={block}
            onClose={onCloseActionMenu}
            onDelete={() => onDeleteBlock(block.id)}
            onSetBackgroundColor={(backgroundColor) =>
              onSetBlockColor(block.id, { backgroundColor })
            }
            onSetTextColor={(textColor) =>
              onSetBlockColor(block.id, { textColor })
            }
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={registerBlockElement}
      style={style}
      className={cn(
        "group relative flex items-start gap-1",
        isNested && "ml-12 border-l border-white/10 pl-3",
        isDragging && "opacity-35",
        dropIntent?.type === "nest" &&
          "rounded-lg bg-accent/10 ring-1 ring-accent/45",
      )}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenActionMenu(block.id);
      }}
    >
      {dropIntent?.type === "line" ? (
        <span className="absolute -top-1 left-10 right-0 h-0.5 rounded-full bg-accent shadow-[0_0_12px_rgb(59_130_246/_70%)]" />
      ) : null}
      <button
        aria-label="Добавить строку ниже"
        className="mt-0.5 grid size-7 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
        type="button"
        onClick={() => onInsertAfter(block.id)}
      >
        <Plus aria-hidden="true" size={16} />
      </button>
      <button
        aria-label="Открыть меню блока"
        className="mt-0.5 grid size-7 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
        type="button"
        onClick={() => onOpenActionMenu(block.id)}
      >
        <MoreHorizontal aria-hidden="true" size={16} />
      </button>
      <button
        {...attributes}
        {...listeners}
        aria-label="Переместить блок"
        className="mt-0.5 grid size-7 touch-none place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/8 hover:text-text group-hover:opacity-80"
        type="button"
      >
        <GripVertical aria-hidden="true" size={16} />
      </button>

      {block.type === "bulleted" ? (
        <span className="mt-3 size-1.5 shrink-0 rounded-full bg-text-muted" />
      ) : null}
      {block.type === "numbered" ? (
        <span className="mt-1.5 w-7 shrink-0 text-right text-sm tabular-nums text-text-muted">
          {numberedListNumber ?? 1}.
        </span>
      ) : null}
      {block.type === "todo" ? (
        <button
          aria-label={block.checked ? "Снять отметку" : "Отметить выполненным"}
          className={cn(
            "mt-1.5 grid size-5 shrink-0 place-items-center rounded border transition",
            block.checked
              ? "border-emerald-300/45 bg-emerald-400/20 text-emerald-100"
              : "border-white/20 text-transparent hover:border-white/40",
          )}
          type="button"
          onClick={() => onToggleTodo(block)}
        >
          <Check aria-hidden="true" size={13} />
        </button>
      ) : null}
      {block.type === "toggle" ? (
        <button
          aria-label={block.collapsed ? "Развернуть" : "Свернуть"}
          className="mt-1 grid size-6 shrink-0 place-items-center rounded-md text-text-muted transition hover:bg-white/8 hover:text-text"
          type="button"
          onClick={() => onToggleCollapsed(block)}
        >
          <ChevronRight
            aria-hidden="true"
            className={cn("transition", !block.collapsed && "rotate-90")}
            size={16}
          />
        </button>
      ) : null}
      {block.type === "callout" ? (
        <span className="mt-2 grid size-6 shrink-0 place-items-center rounded-md bg-amber-300/12 text-sm">
          !
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        {block.type === "linked-card" ? (
          <button
            className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-white/10 bg-control/35 px-3 py-2 text-left transition hover:border-accent/45 hover:bg-control/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            onClick={() => onOpenLinkedCard(block)}
          >
            {linkedTask?.card.sticker ? (
              <span aria-hidden="true" className="shrink-0 text-lg leading-none">
                {linkedTask.card.sticker}
              </span>
            ) : (
              <span className="size-2.5 shrink-0 rounded-full bg-accent" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-text">
                {linkedTask?.card.title || block.text || "Задача недоступна"}
              </span>
              <span className="block truncate text-xs text-text-muted">
                {linkedTask
                  ? `${linkedTask.boardTitle} / ${linkedTask.listTitle}`
                  : "Карточка не найдена в текущей доске"}
              </span>
            </span>
            {linkedTask?.card.dueDate ? (
              <span className="shrink-0 rounded-md border border-white/10 bg-black/12 px-2 py-1 text-[11px] font-semibold tabular-nums text-text-muted">
                {linkedTask.card.dueDate}
              </span>
            ) : null}
          </button>
        ) : block.type === "table" ? (
          <div className="max-w-full overflow-x-auto rounded-lg pb-2">
            <div
              className="grid overflow-hidden rounded-lg border border-white/12 bg-black/14 text-sm text-text"
              style={{
                gridTemplateColumns: `repeat(${tableColumnCount}, minmax(9rem, 1fr))`,
                minWidth:
                  tableColumnCount > 4
                    ? `${tableColumnCount * 9}rem`
                    : undefined,
              }}
            >
              {tableCells.map((row, rowIndex) =>
                row.map((cell, cellIndex) => (
                  <NotesTableCell
                    key={`${rowIndex}-${cellIndex}`}
                    blockId={block.id}
                    canDeleteColumn={tableColumnCount > 1}
                    canDeleteRow={tableCells.length > 1}
                    cellIndex={cellIndex}
                    className={cn(
                      rowIndex < tableCells.length - 1 &&
                        "border-b border-white/10",
                      cellIndex < tableColumnCount - 1 &&
                        "border-r border-white/10",
                      tableHasHeaderRow && rowIndex === 0 && "bg-white/5",
                    )}
                    isHeader={tableHasHeaderRow && rowIndex === 0}
                    isMenuOpen={
                      openTableCellMenu?.blockId === block.id &&
                      openTableCellMenu.rowIndex === rowIndex &&
                      openTableCellMenu.cellIndex === cellIndex
                    }
                    placeholder={
                      tableHasHeaderRow && rowIndex === 0
                        ? `Столбец ${cellIndex + 1}`
                        : "Пусто"
                    }
                    rowIndex={rowIndex}
                    tableHasHeaderRow={tableHasHeaderRow}
                    value={cell}
                    onCloseMenu={onCloseTableCellMenu}
                    onChange={(value) =>
                      onUpdateTableCell(block.id, rowIndex, cellIndex, value)
                    }
                    onKeyDown={(event) =>
                      onTableCellKeyDown(event, block, rowIndex, cellIndex)
                    }
                    onOpenMenu={() =>
                      onOpenTableCellMenu(block.id, rowIndex, cellIndex)
                    }
                    onRegisterElement={(element) =>
                      onRegisterTableCell(block.id, rowIndex, cellIndex, element)
                    }
                    onTableAction={(action) =>
                      onTableCellAction(block.id, rowIndex, cellIndex, action)
                    }
                  />
                )),
              )}
            </div>
          </div>
        ) : (
          <NotesEditableBlock
            block={block}
            className={cn(
              "min-w-0 flex-1 rounded-md px-1.5 py-0.5 outline-none transition empty:before:text-transparent empty:before:content-[attr(data-placeholder)] group-hover:empty:before:text-text-muted/60 focus:empty:before:text-text-muted/60 focus:bg-white/5",
              "whitespace-pre-wrap",
              getBlockClassName(block.type),
              getBlockColorClassName(block),
              block.type === "todo" &&
                block.checked &&
                "text-text-muted line-through",
            )}
            registerElement={(element) => onRegisterElement(block.id, element)}
            style={getBlockStyle(block)}
            onBlur={(element) => onBlur(block, element)}
            onInput={(element) => onInput(block, element)}
            onKeyDown={(event) => onKeyDown(event, block)}
            onPasteMarkdown={(text, element) =>
              onPasteMarkdown(block, text, element)
            }
            onSelectionChange={(element) => onSelectionChange(block, element)}
          />
        )}
      </div>

      {isSlashMenuOpen ? (
        <NotesBlockCommandMenu
          anchorRef={blockElementRef}
          commands={menuCommands}
          showTaskCreateSection={showTaskCreateSection}
          taskCreateTargets={taskCreateTargets}
          tasks={filterTaskItems(
            taskItems,
            block.text.startsWith("/") ? block.text.slice(1) : "",
          )}
          onClose={onCloseSlashMenu}
          onCreateTask={(target) => onCreateTask(block, target)}
          onSelect={(command) => onSelectCommand(block, command)}
          onSelectTask={(task) => onSelectTask(block, task)}
        />
      ) : null}
      {isActionMenuOpen ? (
        <NotesBlockActionMenu
          block={block}
          onClose={onCloseActionMenu}
          onDelete={() => onDeleteBlock(block.id)}
          onSetBackgroundColor={(backgroundColor) =>
            onSetBlockColor(block.id, { backgroundColor })
          }
          onSetTextColor={(textColor) =>
            onSetBlockColor(block.id, { textColor })
          }
        />
      ) : null}
    </div>
  );
}
