"use client";

import { Check, ChevronDown, FileText, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { Note } from "@/features/manage-notes";
import { cn } from "@/shared/lib";
import { useKeyboardListNavigation } from "@/shared/ui";

type NoteSwitcherProps = Readonly<{
  activeNote: Note;
  isOpen: boolean;
  notes: readonly Note[];
  onDelete: (noteId: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (noteId: string) => void;
}>;

export function NoteSwitcher({
  activeNote,
  isOpen,
  notes,
  onDelete,
  onOpenChange,
  onSelect,
}: NoteSwitcherProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const noteIds = useMemo(() => notes.map((note) => note.id), [notes]);
  const selectNoteFromMenu = useCallback(
    (index: number) => {
      const noteId = noteIds[index];

      if (!noteId) {
        return;
      }

      onSelect(noteId);
      onOpenChange(false);
    },
    [noteIds, onOpenChange, onSelect],
  );
  const {
    activeIndex,
    activeItemId,
    getItemProps,
    handleKeyDown: handleMenuKeyDown,
  } = useKeyboardListNavigation({
    count: notes.length,
    getItemId: (index) => `note-switcher-note-${noteIds[index] ?? index}`,
    onClose: () => onOpenChange(false),
    onSelect: selectNoteFromMenu,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
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

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", handleNavigationKeyDown);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", handleNavigationKeyDown);
    };
  }, [handleMenuKeyDown, isOpen, onOpenChange]);

  return (
    <div ref={menuRef} className="relative min-w-0 flex-1">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-control/45 px-3 text-left text-text transition hover:border-white/20 hover:bg-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && "border-accent/55 ring-2 ring-accent/20",
        )}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
      >
        <FileText
          aria-hidden="true"
          className="hidden shrink-0 text-accent sm:block"
          size={17}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {activeNote.title || "Без названия"}
          </span>
          <span className="block truncate text-xs text-text-muted">
            {new Date(activeNote.updatedAt).toLocaleDateString("ru-RU")}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "shrink-0 text-text-muted transition",
            isOpen && "rotate-180 text-text",
          )}
          size={17}
        />
      </button>

      {isOpen ? (
        <div
          aria-activedescendant={activeItemId}
          aria-label="Заметки"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-70 overflow-hidden rounded-2xl border border-white/10 bg-panel/98 p-2 shadow-2xl backdrop-blur-xl"
          role="menu"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
        >
          <div className="flex items-center justify-between gap-3 px-2 py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Заметки
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {notes.length} заметок
              </p>
            </div>
          </div>

          <div className="max-h-[15rem] overflow-y-auto px-1 py-1">
            {notes.map((note, noteIndex) => {
              const isActive = note.id === activeNote.id;
              const isKeyboardActive = activeIndex === noteIndex;

              return (
                <div
                  key={note.id}
                  className={cn(
                    "group flex min-h-12 w-full min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 transition",
                    isActive || isKeyboardActive
                      ? "bg-accent/15 text-text"
                      : "text-text-muted hover:bg-control hover:text-text",
                  )}
                  role="none"
                >
                  <button
                    {...getItemProps(noteIndex)}
                    aria-current={isActive ? "page" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      onSelect(note.id);
                      onOpenChange(false);
                    }}
                  >
                    <FileText
                      aria-hidden="true"
                      className="shrink-0"
                      size={17}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {note.title || "Без названия"}
                      </span>
                      <span className="block truncate text-xs opacity-70">
                        {new Date(note.updatedAt).toLocaleDateString("ru-RU")}
                      </span>
                    </span>
                  </button>
                  {isActive ? (
                    <Check
                      aria-hidden="true"
                      className="shrink-0 text-accent"
                      size={16}
                    />
                  ) : null}
                  <button
                    aria-label={`Удалить заметку ${note.title || "Без названия"}`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted opacity-70 transition hover:bg-red-500/15 hover:text-red-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
                    type="button"
                    onClick={() => {
                      onDelete(note.id);
                      onOpenChange(false);
                    }}
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
