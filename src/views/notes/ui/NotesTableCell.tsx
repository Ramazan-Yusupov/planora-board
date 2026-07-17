"use client";

import { Check, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib";
import { useViewportMenuPosition } from "@/shared/ui";

import { getTextFromEditable } from "../lib/notesEditorModel";

export type TableCellAction =
  | "insert-row-above"
  | "insert-row-below"
  | "delete-row"
  | "insert-column-left"
  | "insert-column-right"
  | "delete-column"
  | "toggle-header-row";

type NotesTableCellProps = Readonly<{
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
        aria-checked={hasHeaderRow}
        className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10"
        role="menuitemcheckbox"
        type="button"
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

export function NotesTableCell({
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
}: NotesTableCellProps) {
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
