"use client";

import {
  closestCenter,
  DndContext,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bold,
  ChevronRight,
  Check,
  Code2,
  GripVertical,
  Italic,
  MoreHorizontal,
  Plus,
  Strikethrough,
  Trash2,
  Underline,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type RefCallback,
  type RefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import type { Board } from "@/entities/board";
import {
  parseMarkdownBlocks,
  type NoteBlock,
} from "@/features/manage-notes";
import { cn } from "@/shared/lib";
import { useKeyboardListNavigation, useViewportMenuPosition } from "@/shared/ui";

import {
  NOTES_ROOT_DROP_ZONE_ID,
  DEFAULT_TABLE_COLUMN_COUNT,
  applyInlineFormat,
  backgroundColorOptions,
  basicBlockCommands,
  clearEditableText,
  createBlock,
  escapeInlineHtml,
  filterTaskItems,
  getActiveInlineFormats,
  getActiveTaskCreateTargets,
  getBlockClassName,
  getBlockColorClassName,
  getBlockInlineHtml,
  getBlockStyle,
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
  placeCaretAtEnd,
  sanitizeInlineHtml,
  textColorOptions,
  type BlockCommand,
  type InlineFormat,
  type NoteDropIntent,
  type NoteDropTarget,
  type NoteTaskCreateTarget,
  type NoteTaskItem,
} from "../lib/notesEditorModel";
type NotesEditorProps = Readonly<{
  activeBoard: Board;
  blocks: readonly NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  onCreateTask: (listId: string, title: string) => NoteTaskItem | null;
  onOpenCard: (cardId: string) => void;
}>;

type EditableBlockProps = Readonly<{
  block: NoteBlock;
  className: string;
  registerElement: RefCallback<HTMLElement>;
  style?: CSSProperties;
  onBlur: (element: HTMLElement) => void;
  onInput: (element: HTMLElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPasteMarkdown: (text: string, element: HTMLElement) => boolean;
  onSelectionChange: (element: HTMLElement) => void;
}>;

function EditableBlock({
  block,
  className,
  registerElement,
  style,
  onBlur,
  onInput,
  onKeyDown,
  onPasteMarkdown,
  onSelectionChange,
}: EditableBlockProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || document.activeElement === element) {
      return;
    }

    const html = getBlockInlineHtml(block);

    if (sanitizeInlineHtml(element.innerHTML) !== html) {
      element.innerHTML = html;
    }
  }, [block]);

  return (
    <div
      ref={(element) => {
        elementRef.current = element;
        registerElement(element);

        if (element && document.activeElement !== element) {
          element.innerHTML = getBlockInlineHtml(block);
        }
      }}
      className={cn(
        className,
        "cursor-text [&_code]:rounded [&_code]:border [&_code]:border-white/10 [&_code]:bg-white/8 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-sky-100",
      )}
      contentEditable
      data-placeholder="Напишите что-нибудь или введите ###, ---, -"
      role="textbox"
      style={style}
      suppressContentEditableWarning
      onBlur={(event) => onBlur(event.currentTarget)}
      onInput={(event) => onInput(event.currentTarget)}
      onKeyDown={onKeyDown}
      onKeyUp={(event) => onSelectionChange(event.currentTarget)}
      onMouseUp={(event) => onSelectionChange(event.currentTarget)}
      onPaste={(event) => {
        const text = event.clipboardData.getData("text/plain");

        if (onPasteMarkdown(text, event.currentTarget)) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        document.execCommand("insertHTML", false, escapeInlineHtml(text));
        onInput(event.currentTarget);
      }}
    />
  );
}

type EditableTableCellProps = Readonly<{
  blockId: string;
  canDeleteColumn: boolean;
  canDeleteRow: boolean;
  cellIndex: number;
  className?: string;
  isHeader: boolean;
  isMenuOpen: boolean;
  placeholder: string;
  rowIndex: number;
  tableHasHeaderRow: boolean;
  value: string;
  onChange: (value: string) => void;
  onCloseMenu: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onOpenMenu: () => void;
  onRegisterElement: (element: HTMLElement | null) => void;
  onTableAction: (action: TableCellAction) => void;
}>;

function EditableTableCell({
  blockId,
  canDeleteColumn,
  canDeleteRow,
  cellIndex,
  className,
  isHeader,
  isMenuOpen,
  placeholder,
  rowIndex,
  tableHasHeaderRow,
  value,
  onChange,
  onCloseMenu,
  onKeyDown,
  onOpenMenu,
  onRegisterElement,
  onTableAction,
}: EditableTableCellProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || document.activeElement === element) {
      return;
    }

    if (element.textContent !== value) {
      element.textContent = value;
    }
  }, [value]);

  return (
    <div
      ref={wrapperRef}
      className={cn("group/cell relative min-h-9", className)}
      onContextMenu={(event: MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        onOpenMenu();
      }}
    >
      <div
        ref={(element) => {
          elementRef.current = element;
          onRegisterElement(element);

          if (element && document.activeElement !== element) {
            element.textContent = value;
          }
        }}
        className={cn(
          "min-h-9 px-3 py-2 pr-8 outline-none empty:before:text-text-muted/55 empty:before:content-[attr(data-placeholder)] focus:bg-white/5",
          isHeader && "font-medium text-white",
        )}
        contentEditable
        data-placeholder={placeholder}
        data-table-block-id={blockId}
        data-table-cell-index={cellIndex}
        data-table-row-index={rowIndex}
        role="textbox"
        suppressContentEditableWarning
        onInput={(event) => onChange(getTextFromEditable(event.currentTarget))}
        onKeyDown={onKeyDown}
      />
      <button
        aria-label="Открыть меню ячейки"
        className="absolute right-1 top-1 grid size-6 place-items-center rounded-md text-text-muted opacity-0 transition hover:bg-white/10 hover:text-text focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent/60 group-hover/cell:opacity-80 group-focus-within/cell:opacity-80"
        type="button"
        onClick={onOpenMenu}
      >
        <MoreHorizontal aria-hidden="true" size={14} />
      </button>
      {isMenuOpen ? (
        <TableCellActionMenu
          anchorRef={wrapperRef}
          canDeleteColumn={canDeleteColumn}
          canDeleteRow={canDeleteRow}
          hasHeaderRow={tableHasHeaderRow}
          onAction={onTableAction}
          onClose={onCloseMenu}
        />
      ) : null}
    </div>
  );
}

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

type TableCellAction =
  | "insert-row-above"
  | "insert-row-below"
  | "delete-row"
  | "insert-column-left"
  | "insert-column-right"
  | "delete-column"
  | "toggle-header-row";

type InlineFormatMenuState = Readonly<{
  blockId: string;
  left: number;
  top: number;
  activeFormats: ReadonlySet<InlineFormat>;
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

function useViewportMenuStyle(
  menuRef: RefObject<HTMLDivElement | null>,
  maxHeight = 352,
  placementKey = 0,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) {
      return;
    }

    const margin = 8;
    const rect = menu.getBoundingClientRect();
    const availableHeight = window.innerHeight - margin * 2;
    const nextMaxHeight = Math.min(maxHeight, availableHeight);
    const overflowBottom = rect.bottom - (window.innerHeight - margin);
    const overflowTopAfterShift = rect.top - Math.max(0, overflowBottom);
    const shiftY =
      overflowBottom > 0
        ? -Math.min(overflowBottom, Math.max(0, overflowTopAfterShift - margin))
        : 0;

    setStyle({
      maxHeight: nextMaxHeight,
      transform: shiftY ? `translateY(${shiftY}px)` : undefined,
    });
  }, [maxHeight, menuRef, placementKey]);

  return style;
}

type BlockCommandMenuItem =
  | Readonly<{
      command: BlockCommand;
      id: string;
      type: "command";
    }>
  | Readonly<{
      id: string;
      target: NoteTaskCreateTarget;
      type: "create-task";
    }>
  | Readonly<{
      id: string;
      task: NoteTaskItem;
      type: "task";
    }>;

function BlockCommandMenu({
  anchorRef,
  commands,
  showTaskCreateSection,
  taskCreateTargets,
  tasks,
  onClose,
  onCreateTask,
  onSelect,
  onSelectTask,
}: Readonly<{
  anchorRef: RefObject<HTMLDivElement | null>;
  commands: readonly BlockCommand[];
  showTaskCreateSection: boolean;
  taskCreateTargets: readonly NoteTaskCreateTarget[];
  tasks: readonly NoteTaskItem[];
  onClose: () => void;
  onCreateTask: (target: NoteTaskCreateTarget) => void;
  onSelect: (command: BlockCommand) => void;
  onSelectTask: (task: NoteTaskItem) => void;
}>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { style: menuStyle } = useViewportMenuPosition({
    anchorRef,
    maxHeight: 440,
    menuRef,
    width: 352,
  });
  const menuItems = useMemo<readonly BlockCommandMenuItem[]>(
    () => [
      ...commands.map((command) => ({
        command,
        id: `command-${command.id}`,
        type: "command" as const,
      })),
      ...(showTaskCreateSection
        ? taskCreateTargets.map((target) => ({
            id: `create-task-${target.listId}`,
            target,
            type: "create-task" as const,
          }))
        : []),
      ...tasks.map((task) => ({
        id: `task-${task.boardId}-${task.card.id}`,
        task,
        type: "task" as const,
      })),
    ],
    [commands, showTaskCreateSection, taskCreateTargets, tasks],
  );
  const activateMenuItem = useCallback(
    (index: number) => {
      const item = menuItems[index];

      if (!item) {
        return;
      }

      if (item.type === "command") {
        onSelect(item.command);
        return;
      }

      if (item.type === "create-task") {
        if (!item.target.isDisabled) {
          onCreateTask(item.target);
        }
        return;
      }

      onSelectTask(item.task);
    },
    [menuItems, onCreateTask, onSelect, onSelectTask],
  );
  const isMenuItemDisabled = useCallback(
    (index: number) => {
      const item = menuItems[index];

      return item?.type === "create-task" ? item.target.isDisabled : false;
    },
    [menuItems],
  );
  const {
    activeIndex,
    activeItemId,
    getItemProps,
    handleKeyDown: handleMenuKeyDown,
  } = useKeyboardListNavigation({
    count: menuItems.length,
    getItemId: (index) => `notes-slash-menu-${menuItems[index]?.id ?? index}`,
    isItemDisabled: isMenuItemDisabled,
    onClose,
    onSelect: activateMenuItem,
  });

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const handleNavigationKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "PageDown" ||
        event.key === "PageUp" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === "Enter" ||
        event.key === "Escape"
      ) {
        handleMenuKeyDown(event);
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", handleNavigationKeyDown);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", handleNavigationKeyDown);
    };
  }, [handleMenuKeyDown, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      aria-activedescendant={activeItemId}
      className="flex flex-col overflow-hidden rounded-lg border border-white/12 bg-[#242424] text-white shadow-2xl"
      role="menu"
      style={{
        ...menuStyle,
        zIndex: 85,
      }}
      tabIndex={-1}
      onKeyDown={handleMenuKeyDown}
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="min-h-24 flex-1 overflow-y-auto p-1.5">
        <p className="px-2 py-1.5 text-xs font-semibold text-white/45">
          Basic blocks
        </p>
        {commands.length > 0 ? (
          commands.map((command, commandIndex) => (
            <button
              key={command.id}
              {...getItemProps(commandIndex)}
              className={cn(
                "flex min-h-10 w-full items-center gap-3 rounded-md px-2.5 text-left text-sm transition hover:bg-white/10 focus:bg-white/10 focus:outline-none",
                activeIndex === commandIndex && "bg-white/10",
              )}
              role="menuitem"
              type="button"
              onClick={() => onSelect(command)}
            >
              <span className="grid size-6 shrink-0 place-items-center text-white/78">
                {command.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white/90">
                  {command.title}
                </span>
                <span className="block truncate text-xs text-white/42">
                  {command.description}
                </span>
              </span>
              {command.shortcut ? (
                <span className="shrink-0 font-mono text-xs text-white/32">
                  {command.shortcut}
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <p className="px-2.5 py-6 text-center text-sm text-white/45">
            Ничего не найдено
          </p>
        )}
      </div>
      {showTaskCreateSection ? (
        <div className="shrink-0 border-t border-white/10 p-1.5">
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <p className="text-xs font-semibold text-white/45">
              Создать задачу
            </p>
            <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/38">
              {taskCreateTargets.length}
            </span>
          </div>
          <div className="max-h-[6.75rem] overflow-x-hidden overflow-y-auto pr-1">
            {taskCreateTargets.length > 0 ? (
              <div className="grid min-w-0 gap-1">
                {taskCreateTargets.map((target, targetIndex) => {
                  const itemIndex = commands.length + targetIndex;

                  return (
                  <button
                    key={target.listId}
                    {...getItemProps(itemIndex)}
                    className={cn(
                      "flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 text-left text-sm transition focus:border-accent/60 focus:outline-none",
                      target.isDisabled
                        ? "cursor-not-allowed opacity-45"
                        : "hover:border-accent/45 hover:bg-white/10",
                      activeIndex === itemIndex &&
                        !target.isDisabled &&
                        "border-accent/45 bg-white/10",
                    )}
                    disabled={target.isDisabled}
                    role="menuitem"
                    title={
                      target.disabledReason
                        ? `${target.listTitle}: ${target.disabledReason}`
                        : `Создать задачу в «${target.listTitle}»`
                    }
                    type="button"
                    onClick={() => onCreateTask(target)}
                  >
                    <Plus
                      aria-hidden="true"
                      className="shrink-0 text-accent"
                      size={16}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block max-w-full truncate font-semibold text-white/90">
                        {target.listTitle}
                      </span>
                      <span className="block max-w-full truncate text-xs text-white/42">
                        {target.disabledReason ?? "Из текущей строки"}
                      </span>
                    </span>
                  </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-2.5 py-4 text-center text-sm text-white/45">
                Нет доступных списков
              </p>
            )}
          </div>
        </div>
      ) : null}
      <div className="shrink-0 border-t border-white/10 p-1.5">
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <p className="text-xs font-semibold text-white/45">Задачи доски</p>
          <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/38">
            {tasks.length}
          </span>
        </div>
        <div className="max-h-[6.75rem] overflow-x-hidden overflow-y-auto pr-1">
          {tasks.length > 0 ? (
            <div className="grid min-w-0 gap-1">
              {tasks.map((task, taskIndex) => {
                const itemIndex =
                  commands.length +
                  (showTaskCreateSection ? taskCreateTargets.length : 0) +
                  taskIndex;

                return (
                <button
                  key={`${task.boardId}-${task.card.id}`}
                  {...getItemProps(itemIndex)}
                  className={cn(
                    "flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 text-left text-sm transition hover:border-accent/45 hover:bg-white/10 focus:border-accent/60 focus:outline-none",
                    activeIndex === itemIndex && "border-accent/45 bg-white/10",
                  )}
                  role="menuitem"
                  title={`${task.boardTitle}: ${task.card.title}`}
                  type="button"
                  onClick={() => onSelectTask(task)}
                >
                  {task.card.sticker ? (
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-base leading-none"
                    >
                      {task.card.sticker}
                    </span>
                  ) : (
                    <span className="size-2 shrink-0 rounded-full bg-accent" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block max-w-full truncate font-semibold text-white/90">
                      {task.card.title}
                    </span>
                    <span className="block max-w-full truncate text-xs text-white/42">
                      {task.listTitle}
                      {task.card.dueDate ? ` · ${task.card.dueDate}` : ""}
                    </span>
                  </span>
                </button>
                );
              })}
            </div>
          ) : (
            <p className="px-2.5 py-4 text-center text-sm text-white/45">
              В этой доске нет задач
            </p>
          )}
        </div>
      </div>
      <div className="flex min-h-10 items-center justify-between border-t border-white/10 px-3 text-sm">
        <button
          className="font-medium text-white/85 transition hover:text-white"
          type="button"
          onClick={onClose}
        >
          Close menu
        </button>
        <span className="text-xs text-white/35">esc</span>
      </div>
    </div>,
    document.body,
  );
}

function BlockActionMenu({
  block,
  onClose,
  onDelete,
  onSetBackgroundColor,
  onSetTextColor,
}: Readonly<{
  block: NoteBlock;
  onClose: () => void;
  onDelete: () => void;
  onSetBackgroundColor: (color: string | undefined) => void;
  onSetTextColor: (color: string | undefined) => void;
}>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const viewportStyle = useViewportMenuStyle(menuRef, 304);
  const canChangeColors = block.type !== "linked-card" && block.type !== "table";

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", onClose);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute left-8 top-9 z-40 w-[min(18rem,calc(100vw-3rem))] overflow-y-auto rounded-lg border border-white/12 bg-[#242424] p-1.5 text-white shadow-2xl"
      role="menu"
      style={viewportStyle}
      onMouseDown={(event) => event.preventDefault()}
    >
      <button
        className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/12"
        role="menuitem"
        type="button"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <Trash2 aria-hidden="true" size={15} />
        Удалить
      </button>

      {canChangeColors ? (
        <>
          <div className="mt-1 border-t border-white/10 pt-2">
            <p className="px-2 py-1 text-xs font-semibold text-white/45">
              Цвет текста
            </p>
            <div className="grid gap-1">
              {textColorOptions.map((option) => {
                const value = option.id === "default" ? undefined : option.id;
                const isActive = (block.textColor ?? "default") === option.id;

                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10",
                      isActive && "bg-white/10 text-white",
                    )}
                    role="menuitem"
                    type="button"
                    onClick={() => onSetTextColor(value)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-3 rounded-full",
                        option.swatchClassName,
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {isActive ? <Check aria-hidden="true" size={14} /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-1 border-t border-white/10 pt-2">
            <p className="px-2 py-1 text-xs font-semibold text-white/45">
              Фон
            </p>
            <div className="grid gap-1">
              {backgroundColorOptions.map((option) => {
                const value = option.id === "default" ? undefined : option.id;
                const isActive =
                  (block.backgroundColor ?? "default") === option.id;

                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10",
                      isActive && "bg-white/10 text-white",
                    )}
                    role="menuitem"
                    type="button"
                    onClick={() => onSetBackgroundColor(value)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-3 rounded-full",
                        option.swatchClassName,
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {isActive ? <Check aria-hidden="true" size={14} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function TableCellActionMenu({
  anchorRef,
  canDeleteColumn,
  canDeleteRow,
  hasHeaderRow,
  onAction,
  onClose,
}: Readonly<{
  anchorRef: RefObject<HTMLDivElement | null>;
  canDeleteColumn: boolean;
  canDeleteRow: boolean;
  hasHeaderRow: boolean;
  onAction: (action: TableCellAction) => void;
  onClose: () => void;
}>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { style: menuStyle } = useViewportMenuPosition({
    align: "end",
    anchorRef,
    maxHeight: 240,
    menuRef,
    width: 256,
  });

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const runAction = (action: TableCellAction) => {
    onAction(action);
    onClose();
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className="overflow-y-auto rounded-lg border border-white/12 bg-[#242424] p-1.5 text-white shadow-2xl"
      role="menu"
      style={{
        ...menuStyle,
        zIndex: 80,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitem"
        type="button"
        onClick={() => runAction("insert-row-above")}
      >
        <Plus aria-hidden="true" size={14} />
        Строка выше
      </button>
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitem"
        type="button"
        onClick={() => runAction("insert-row-below")}
      >
        <Plus aria-hidden="true" size={14} />
        Строка ниже
      </button>
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitem"
        type="button"
        onClick={() => runAction("insert-column-left")}
      >
        <Plus aria-hidden="true" size={14} />
        Колонка слева
      </button>
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitem"
        type="button"
        onClick={() => runAction("insert-column-right")}
      >
        <Plus aria-hidden="true" size={14} />
        Колонка справа
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitemcheckbox"
        type="button"
        aria-checked={hasHeaderRow}
        onClick={() => runAction("toggle-header-row")}
      >
        <span className="grid size-4 place-items-center">
          {hasHeaderRow ? <Check aria-hidden="true" size={14} /> : null}
        </span>
        Header row
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-red-200 transition hover:bg-red-500/12 disabled:cursor-not-allowed disabled:text-white/28 disabled:hover:bg-transparent"
        disabled={!canDeleteRow}
        role="menuitem"
        type="button"
        onClick={() => runAction("delete-row")}
      >
        <Trash2 aria-hidden="true" size={14} />
        Удалить строку
      </button>
      <button
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-red-200 transition hover:bg-red-500/12 disabled:cursor-not-allowed disabled:text-white/28 disabled:hover:bg-transparent"
        disabled={!canDeleteColumn}
        role="menuitem"
        type="button"
        onClick={() => runAction("delete-column")}
      >
        <Trash2 aria-hidden="true" size={14} />
        Удалить колонку
      </button>
    </div>,
    document.body,
  );
}

function InlineFormatBubble({
  menu,
  onFormat,
}: Readonly<{
  menu: InlineFormatMenuState;
  onFormat: (format: InlineFormat) => void;
}>) {
  if (!menu || typeof document === "undefined") {
    return null;
  }

  const actions: ReadonlyArray<{
    format: InlineFormat;
    label: string;
    icon: ReactNode;
  }> = [
    {
      format: "bold",
      label: "Bold",
      icon: <Bold aria-hidden="true" size={15} />,
    },
    {
      format: "italic",
      label: "Italic",
      icon: <Italic aria-hidden="true" size={15} />,
    },
    {
      format: "underline",
      label: "Underline",
      icon: <Underline aria-hidden="true" size={15} />,
    },
    {
      format: "strike",
      label: "Strike",
      icon: <Strikethrough aria-hidden="true" size={15} />,
    },
    {
      format: "code",
      label: "Inline code",
      icon: <Code2 aria-hidden="true" size={15} />,
    },
  ];

  return createPortal(
    <div
      className="fixed z-[90] flex items-center gap-1 rounded-lg border border-white/12 bg-[#242424] p-1 text-white shadow-2xl"
      role="toolbar"
      style={{
        left: menu.left,
        top: menu.top,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {actions.map((action) => {
        const isActive = menu.activeFormats.has(action.format);

        return (
          <button
            key={action.format}
            aria-label={action.label}
            aria-pressed={isActive}
            className={cn(
              "grid size-8 place-items-center rounded-md text-white/72 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
              isActive && "bg-white/14 text-white",
            )}
            type="button"
            onClick={() => onFormat(action.format)}
          >
            {action.icon}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

function RootDropZone({
  isDraggingNestedBlock,
}: Readonly<{
  isDraggingNestedBlock: boolean;
}>) {
  const { isOver, setNodeRef } = useDroppable({
    id: NOTES_ROOT_DROP_ZONE_ID,
    data: { type: "notes-root-drop-zone" },
  });

  if (!isDraggingNestedBlock) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-2 ml-[6.5rem] rounded-lg border border-dashed border-white/14 bg-control/20 px-3 py-2 text-xs font-medium text-text-muted transition",
        isOver && "border-accent/70 bg-accent/12 text-text",
      )}
    >
      Отпустите здесь, чтобы вынести блок на корневой уровень
    </div>
  );
}

type SortableNoteBlockProps = Readonly<{
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

function SortableNoteBlock({
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
}: SortableNoteBlockProps) {
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
          <BlockActionMenu
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
                  <EditableTableCell
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
          <EditableBlock
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
        <BlockCommandMenu
          anchorRef={blockElementRef}
          commands={menuCommands}
          showTaskCreateSection={showTaskCreateSection}
          taskCreateTargets={taskCreateTargets}
          tasks={filterTaskItems(taskItems, block.text.startsWith("/") ? block.text.slice(1) : "")}
          onClose={onCloseSlashMenu}
          onCreateTask={(target) => onCreateTask(block, target)}
          onSelect={(command) => onSelectCommand(block, command)}
          onSelectTask={(task) => onSelectTask(block, task)}
        />
      ) : null}
      {isActionMenuOpen ? (
        <BlockActionMenu
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

export function NotesEditor({
  activeBoard,
  blocks,
  onChange,
  onCreateTask,
  onOpenCard,
}: NotesEditorProps) {
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const tableCellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pendingFocusIdRef = useRef<string | null>(null);
  const pendingTableCellFocusRef = useRef<{
    blockId: string;
    rowIndex: number;
    cellIndex: number;
  } | null>(null);
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
            <RootDropZone isDraggingNestedBlock={isDraggingNestedBlock} />
            {visibleBlocks.map((block) => (
              <SortableNoteBlock
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
                className="ml-[6.5rem] mt-2 inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-text-muted transition hover:bg-white/8 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <InlineFormatBubble
        menu={inlineMenu}
        onFormat={applyInlineFormatToCurrentSelection}
      />
    </div>
  );
}


