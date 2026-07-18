"use client";

import {
  Check,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import type { Note } from "@/features/manage-notes";
import { cn } from "@/shared/lib";
import { Button, IconButton, TextField } from "@/shared/ui";

type NotesSidebarProps = Readonly<{
  activeNoteId: string;
  isCollapsed: boolean;
  notes: readonly Note[];
  searchQuery: string;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onSearchChange: (query: string) => void;
  onSelectNote: (noteId: string) => void;
  onToggleCollapsed: () => void;
}>;

export function NotesSidebar({
  activeNoteId,
  isCollapsed,
  notes,
  searchQuery,
  onAddNote,
  onDeleteNote,
  onSearchChange,
  onSelectNote,
  onToggleCollapsed,
}: NotesSidebarProps) {
  if (isCollapsed) {
    return (
      <aside className="hidden h-full min-h-0 shrink-0 border-r border-white/10 bg-panel/72 p-2 lg:flex lg:w-14 lg:flex-col lg:items-center">
        <IconButton
          className="text-text-muted hover:bg-control hover:text-text"
          label="Показать sidebar заметок"
          onClick={onToggleCollapsed}
        >
          <PanelLeftOpen aria-hidden="true" size={18} />
        </IconButton>
      </aside>
    );
  }

  return (
    <aside className="hidden h-full min-h-0 w-72 shrink-0 border-r border-white/10 bg-panel/72 p-3 lg:block">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            className="text-text-muted hover:bg-control hover:text-text"
            label="Скрыть sidebar заметок"
            size="sm"
            onClick={onToggleCollapsed}
          >
            <PanelLeftClose aria-hidden="true" size={17} />
          </IconButton>
          <h2 className="text-sm font-semibold text-text">Notes</h2>
        </div>
        <Button size="sm" onClick={onAddNote}>
          <Plus aria-hidden="true" size={16} />
          Новая
        </Button>
      </div>

      <label className="relative mt-3 block">
        <span className="sr-only">Поиск заметок</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          size={15}
        />
        <TextField
          className="h-10 rounded-lg pl-9"
          placeholder="Поиск заметок"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
        />
      </label>

      <div className="mt-3 max-h-60 space-y-1 overflow-y-auto lg:max-h-[calc(100dvh-12rem)]">
        {notes.length > 0 ? (
          notes.map((note) => {
            const isActive = activeNoteId === note.id;

            return (
              <div
                key={note.id}
                className={cn(
                  "group flex min-h-14 w-full items-center gap-2 rounded-lg px-3 py-2 transition",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-text-muted hover:bg-control hover:text-text",
                )}
                role="none"
              >
                <button
                  aria-current={isActive ? "page" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
                  type="button"
                  onClick={() => onSelectNote(note.id)}
                >
                  <FileText aria-hidden="true" className="shrink-0" size={17} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {note.title || "Без названия"}
                    </span>
                    <span className="block truncate text-xs opacity-75">
                      {new Date(note.updatedAt).toLocaleDateString("ru-RU")}
                    </span>
                  </span>
                </button>

                {isActive ? (
                  <Check
                    aria-hidden="true"
                    className="shrink-0 text-accent-foreground"
                    size={16}
                  />
                ) : null}

                <button
                  aria-label={`Удалить заметку ${note.title || "Без названия"}`}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40 lg:opacity-0 lg:group-hover:opacity-100",
                    isActive
                      ? "text-accent-foreground/75 hover:bg-black/10 hover:text-accent-foreground"
                      : "text-text-muted hover:bg-red-500/15 hover:text-red-300",
                  )}
                  type="button"
                  onClick={() => onDeleteNote(note.id)}
                >
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              </div>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-white/12 px-3 py-5 text-center text-sm text-text-muted">
            Ничего не найдено.
          </p>
        )}
      </div>
    </aside>
  );
}
