"use client";

import { AlertTriangle, FileText, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useBoardWorkspace } from "@/features/manage-board-workspace";
import {
  ANALYTICS_ROUTE,
  CALENDAR_ROUTE,
  NOTES_ROUTE,
  getBoardRoute,
} from "@/shared/config/routes";
import { createId, cn } from "@/shared/lib";
import { Button, ConfirmDialog, IconButton, Textarea, TextField } from "@/shared/ui";
import { ProjectSidebar } from "@/widgets/project-sidebar";
import { WorkspaceHeader } from "@/widgets/workspace-header";

const NOTES_STORAGE_KEY = "planora.notes.v1";

type Note = Readonly<{
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}>;

function createNote(): Note {
  const timestamp = Date.now();

  return {
    id: createId("note"),
    title: "Новая заметка",
    content: "# Новая заметка\n\n- [ ] Связать с задачей\n- Добавить детали",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function loadNotes(): Note[] {
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!Array.isArray(parsed)) {
      return [createNote()];
    }

    const notes = parsed.flatMap((note): Note[] => {
      if (
        !note ||
        typeof note.id !== "string" ||
        typeof note.title !== "string" ||
        typeof note.content !== "string"
      ) {
        return [];
      }

      return [
        {
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: typeof note.createdAt === "number" ? note.createdAt : Date.now(),
          updatedAt: typeof note.updatedAt === "number" ? note.updatedAt : Date.now(),
        },
      ];
    });

    return notes.length > 0 ? notes : [createNote()];
  } catch {
    return [createNote()];
  }
}

function MarkdownPreview({ content }: Readonly<{ content: string }>) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm leading-6 text-text">
      {lines.map((line, index) => {
        const key = `${index}-${line}`;

        if (!line.trim()) {
          return <div key={key} className="h-2" />;
        }

        if (line.startsWith("### ")) {
          return <h4 key={key} className="pt-2 text-base font-semibold">{line.slice(4)}</h4>;
        }

        if (line.startsWith("## ")) {
          return <h3 key={key} className="pt-2 text-lg font-semibold">{line.slice(3)}</h3>;
        }

        if (line.startsWith("# ")) {
          return <h2 key={key} className="pt-1 text-xl font-semibold">{line.slice(2)}</h2>;
        }

        if (line.startsWith("- [ ] ")) {
          return (
            <p key={key} className="flex items-start gap-2 text-text-muted">
              <span className="mt-1 grid size-4 shrink-0 place-items-center rounded border border-white/20" />
              <span>{line.slice(6)}</span>
            </p>
          );
        }

        if (line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
          return (
            <p key={key} className="flex items-start gap-2 text-text-muted line-through">
              <span className="mt-1 grid size-4 shrink-0 place-items-center rounded border border-emerald-300/40 bg-emerald-400/20 text-[10px] text-emerald-100">
                ✓
              </span>
              <span>{line.slice(6)}</span>
            </p>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <p key={key} className="flex items-start gap-2 text-text-muted">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-text-muted" />
              <span>{line.slice(2)}</span>
            </p>
          );
        }

        return <p key={key} className="text-text-muted">{line}</p>;
      })}
    </div>
  );
}

function NotesLoadingState() {
  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
      <p
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
      >
        Загружаем заметки…
      </p>
    </main>
  );
}

export function NotesPage() {
  const router = useRouter();
  const {
    workspace,
    activeBoard,
    isReady,
    persistenceState,
    storageError,
    workspaceStorage,
    createProject,
    deleteProject,
    selectProject,
  } = useBoardWorkspace();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isNotesReady, setIsNotesReady] = useState(false);
  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? notes[0],
    [activeNoteId, notes],
  );
  const deleteNote = deleteNoteId
    ? notes.find((note) => note.id === deleteNoteId)
    : undefined;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const loadedNotes = loadNotes();
      setNotes(loadedNotes);
      setActiveNoteId(loadedNotes[0]?.id ?? null);
      setIsNotesReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isNotesReady) {
      return;
    }

    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [isNotesReady, notes]);

  if (!isReady || !workspace || !activeBoard || !isNotesReady || !activeNote) {
    return <NotesLoadingState />;
  }

  const statusLabel =
    persistenceState === "saving"
      ? "Сохраняем…"
      : persistenceState === "error"
        ? "Ошибка сохранения"
        : workspaceStorage.kind === "folder" && workspaceStorage.isConnected
          ? `Сохранено в папку: ${workspaceStorage.name}`
          : workspaceStorage.kind === "folder"
            ? "Папка требует доступа"
            : "Сохранено в браузере";

  const openBoard = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
    router.push(getBoardRoute(boardId));
  };

  const patchActiveNote = (patch: Partial<Pick<Note, "content" | "title">>) => {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === activeNote.id
          ? { ...note, ...patch, updatedAt: Date.now() }
          : note,
      ),
    );
  };

  const addNote = () => {
    const note = createNote();
    setNotes((currentNotes) => [note, ...currentNotes]);
    setActiveNoteId(note.id);
  };

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="notes"
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        persistenceLabel={statusLabel}
        onOpenAnalytics={() => router.push(ANALYTICS_ROUTE)}
        onOpenBoard={() => openBoard(activeBoard.id)}
        onOpenCalendar={() => router.push(CALENDAR_ROUTE)}
        onOpenNotes={() => router.push(NOTES_ROUTE)}
        onToggleProjects={() => setIsProjectsOpen((current) => !current)}
      >
        <div className="flex flex-col items-center px-2 py-2 sm:px-3">
          <h1 className="text-base font-semibold text-text sm:text-lg">
            Заметки
          </h1>
          <p className="hidden text-xs text-text-muted sm:block">
            Локальные markdown-заметки
          </p>
        </div>
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isProjectsOpen ? (
          <button
            aria-label="Закрыть проекты"
            className="absolute inset-0 z-30 bg-black/55 lg:hidden"
            type="button"
            onClick={() => setIsProjectsOpen(false)}
          />
        ) : null}

        <ProjectSidebar
          activeBoardId={workspace.activeBoardId}
          boards={workspace.boards}
          isOpen={isProjectsOpen}
          onClose={() => setIsProjectsOpen(false)}
          onCreateBoard={(title) => {
            const createdBoardId = createProject(title);
            if (createdBoardId) {
              openBoard(createdBoardId);
            }
          }}
          onDeleteBoard={deleteProject}
          onSelectBoard={openBoard}
        />

        <section className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden">
          {storageError ? (
            <div className="border-b border-amber-300/35 bg-amber-950/70 px-4 py-3 text-amber-100 sm:px-6">
              <div className="mx-auto flex max-w-[1800px] items-start gap-2 text-sm leading-5">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={17}
                />
                <p>{storageError}</p>
              </div>
            </div>
          ) : null}

          <div className="mx-auto grid min-h-0 w-full max-w-[1800px] flex-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:py-6">
            <aside className="min-h-0 rounded-lg border border-white/10 bg-panel/72 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-text">Notes</h2>
                <Button size="sm" onClick={addNote}>
                  <Plus aria-hidden="true" size={16} />
                  Новая
                </Button>
              </div>

              <div className="mt-3 max-h-[17rem] space-y-1 overflow-y-auto lg:max-h-[calc(100dvh-12rem)]">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                      activeNote.id === note.id
                        ? "bg-accent text-accent-foreground"
                        : "text-text-muted hover:bg-control hover:text-text",
                    )}
                    type="button"
                    onClick={() => setActiveNoteId(note.id)}
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
                ))}
              </div>
            </aside>

            <section className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-panel/72 p-4 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]">
                <div className="flex items-center gap-2">
                  <TextField
                    aria-label="Название заметки"
                    className="h-11 text-base font-semibold"
                    value={activeNote.title}
                    onChange={(event) =>
                      patchActiveNote({ title: event.currentTarget.value })
                    }
                  />
                  <IconButton
                    className="text-red-300 hover:bg-red-500/10 hover:text-red-100"
                    label="Удалить заметку"
                    onClick={() => setDeleteNoteId(activeNote.id)}
                  >
                    <Trash2 aria-hidden="true" size={17} />
                  </IconButton>
                </div>

                <Textarea
                  className="mt-3 min-h-[22rem] flex-1 resize-none font-mono text-sm leading-6"
                  value={activeNote.content}
                  onChange={(event) =>
                    patchActiveNote({ content: event.currentTarget.value })
                  }
                />
              </div>

              <div className="min-h-0 overflow-y-auto rounded-lg border border-white/10 bg-panel/72 p-5 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]">
                <MarkdownPreview content={activeNote.content} />
              </div>
            </section>
          </div>
        </section>
      </div>

      <ConfirmDialog
        confirmLabel="Удалить заметку"
        description={
          deleteNote
            ? `Заметка «${deleteNote.title || "Без названия"}» будет удалена.`
            : "Заметка будет удалена."
        }
        destructive
        isOpen={Boolean(deleteNoteId)}
        title="Удалить заметку?"
        onCancel={() => setDeleteNoteId(null)}
        onConfirm={() => {
          if (deleteNoteId) {
            setNotes((currentNotes) => {
              const nextNotes = currentNotes.filter((note) => note.id !== deleteNoteId);
              return nextNotes.length > 0 ? nextNotes : [createNote()];
            });
          }
          setDeleteNoteId(null);
        }}
      />
    </main>
  );
}
