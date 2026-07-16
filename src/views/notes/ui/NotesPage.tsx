"use client";

import { AlertTriangle, FileText, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { addCard } from "@/features/board-management";
import { useBoardWorkspace } from "@/features/manage-board-workspace";
import {
  createNote,
  loadNotes,
  saveNotes,
  type Note,
} from "@/features/manage-notes";
import {
  ANALYTICS_ROUTE,
  CALENDAR_ROUTE,
  MY_WORK_ROUTE,
  NOTES_ROUTE,
  getBoardRoute,
} from "@/shared/config/routes";
import { usePrefetchRoutes } from "@/shared/lib";
import { Button, ConfirmDialog, TextField } from "@/shared/ui";
import { getWorkspaceNavigationActions } from "@/widgets/command-palette/lib/getWorkspaceNavigationActions";
import { useCommandPaletteShortcut } from "@/widgets/command-palette/lib/useCommandPaletteShortcut";
import { ProjectSwitcher } from "@/widgets/project-switcher";
import { WorkspaceHeader } from "@/widgets/workspace-header";

import {
  getCreatedCardFromListDiff,
  getNoteSearchText,
  type NoteTaskItem,
} from "../lib/notesEditorModel";
import { useNoteHistory } from "../lib/useNoteHistory";
import { NotesEditor } from "./NotesEditor";
import { NotesLoadingState } from "./NotesLoadingState";
import { NotesSidebar } from "./NotesSidebar";
import { NoteSwitcher } from "./NoteSwitcher";

const CommandPalette = dynamic(() =>
  import("@/widgets/command-palette/ui/CommandPalette").then(
    (mod) => mod.CommandPalette,
  ),
);
const NotesDataModal = dynamic(() =>
  import("./NotesDataModal").then((mod) => mod.NotesDataModal),
);

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
    updateActiveBoard,
  } = useBoardWorkspace();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isNotesDataOpen, setIsNotesDataOpen] = useState(false);
  const [isNotesReady, setIsNotesReady] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [isNoteSwitcherOpen, setIsNoteSwitcherOpen] = useState(false);
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);
  useCommandPaletteShortcut(openCommandPalette);
  const activeBoardId = activeBoard?.id ?? null;
  usePrefetchRoutes([
    activeBoardId ? getBoardRoute(activeBoardId) : null,
    NOTES_ROUTE,
    CALENDAR_ROUTE,
    MY_WORK_ROUTE,
    ANALYTICS_ROUTE,
  ]);
  const boardNotes = useMemo(
    () =>
      activeBoardId
        ? notes.filter((note) => note.boardId === activeBoardId)
        : [],
    [activeBoardId, notes],
  );
  const activeNote = useMemo(
    () => boardNotes.find((note) => note.id === activeNoteId) ?? boardNotes[0],
    [activeNoteId, boardNotes],
  );
  const filteredBoardNotes = useMemo(() => {
    const query = noteSearchQuery.trim().toLocaleLowerCase("ru-RU");

    if (!query) {
      return boardNotes;
    }

    return boardNotes.filter((note) => getNoteSearchText(note).includes(query));
  }, [boardNotes, noteSearchQuery]);
  const deleteNote = deleteNoteId
    ? notes.find((note) => note.id === deleteNoteId)
    : undefined;
  const {
    canRedoActiveNote,
    canUndoActiveNote,
    recordActiveNoteHistory,
    redoActiveNote,
    undoActiveNote,
  } = useNoteHistory({
    activeNote,
    isBlocked: Boolean(deleteNoteId || isCommandPaletteOpen || isNotesDataOpen),
    setNotes,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const loadedNotes = loadNotes();
      const requestedNoteId = new URLSearchParams(window.location.search).get(
        "note",
      );
      setNotes(loadedNotes);
      setActiveNoteId(requestedNoteId ?? loadedNotes[0]?.id ?? null);
      setIsNotesReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isNotesReady) {
      return;
    }

    saveNotes(notes);
  }, [isNotesReady, notes]);

  useEffect(() => {
    if (!isNotesReady || !workspace || !activeBoard) {
      return;
    }

    const hasUnscopedNotes = notes.some((note) => !note.boardId);

    if (!hasUnscopedNotes) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotes((currentNotes) =>
        currentNotes.map((note) => {
          if (note.boardId) {
            return note;
          }

          const titleMatch = workspace.boards.find(
            (board) =>
              board.title.trim().toLowerCase() ===
              note.title.trim().toLowerCase(),
          );

          return {
            ...note,
            boardId: titleMatch?.id ?? activeBoard.id,
          };
        }),
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeBoard, isNotesReady, notes, workspace]);

  useEffect(() => {
    if (!isNotesReady || !activeBoard) {
      return;
    }

    if (boardNotes.length === 0) {
      const timeoutId = window.setTimeout(() => {
        const note = createNote(activeBoard.id);
        setNotes((currentNotes) => [note, ...currentNotes]);
        setActiveNoteId(note.id);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    if (!activeNoteId || !boardNotes.some((note) => note.id === activeNoteId)) {
      const timeoutId = window.setTimeout(() => {
        setActiveNoteId(boardNotes[0]?.id ?? null);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [activeBoard, activeNoteId, boardNotes, isNotesReady]);

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
            ? "Требуется доступ к папке"
            : "Сохранено в браузере";

  const openBoard = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
    router.push(getBoardRoute(boardId));
  };
  const selectProjectFromHeader = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
  };
  const createProjectFromHeader = (title: string, templateId?: Parameters<typeof createProject>[1]) => {
    const createdBoardId = createProject(title, templateId);

    if (createdBoardId) {
      selectProjectFromHeader(createdBoardId);
    }
  };
  const deleteProjectFromHeader = (boardId: string) => {
    deleteProject(boardId);
    setIsProjectsOpen(false);
  };

  const patchActiveNote = (patch: Partial<Pick<Note, "blocks" | "title">>) => {
    recordActiveNoteHistory();
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === activeNote.id
          ? { ...note, boardId: activeBoard.id, ...patch, updatedAt: Date.now() }
          : note,
      ),
    );
  };

  const addNote = () => {
    const note = createNote(activeBoard.id);
    setNotes((currentNotes) => [note, ...currentNotes]);
    setActiveNoteId(note.id);
  };

  const createTaskFromNote = (
    listId: string,
    title: string,
  ): NoteTaskItem | null => {
    let createdTask: NoteTaskItem | null = null;

    updateActiveBoard((board) => {
      const previousList = board.lists[listId];

      if (!previousList || previousList.isArchived) {
        return board;
      }

      const nextBoard = addCard(board, listId, title);
      const nextList = nextBoard.lists[listId];

      if (nextBoard === board || !nextList) {
        return board;
      }

      const card = getCreatedCardFromListDiff(
        previousList,
        nextList,
        nextBoard.cards,
      );

      if (card) {
        createdTask = {
          boardId: nextBoard.id,
          boardTitle: nextBoard.title,
          card,
          listTitle: nextList.title,
        };
      }

      return nextBoard;
    }, "immediate");

    return createdTask;
  };
  const commandActions = [
    ...getWorkspaceNavigationActions({
      onOpenAnalytics: () => router.push(ANALYTICS_ROUTE),
      onOpenBoard: () => openBoard(activeBoard.id),
      onOpenCalendar: () => router.push(CALENDAR_ROUTE),
      onOpenMyWork: () => router.push(MY_WORK_ROUTE),
      onOpenNotes: () => router.push(NOTES_ROUTE),
    }),
    {
      id: "notes-new-note",
      label: "Новая заметка",
      description: "Создать заметку в активной доске",
      shortcut: "N",
      icon: <Plus aria-hidden="true" size={18} />,
      onSelect: addNote,
    },
    ...boardNotes.map((note) => ({
      id: `note-${note.id}`,
      label: note.title || "Без названия",
      description: `Заметка · ${new Date(note.updatedAt).toLocaleDateString("ru-RU")}`,
      icon: <FileText aria-hidden="true" size={18} />,
      onSelect: () => setActiveNoteId(note.id),
    })),
  ];
  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="notes"
        canRedo={canRedoActiveNote}
        canUndo={canUndoActiveNote}
        dataToolsGroupLabel="Заметки"
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        persistenceLabel={statusLabel}
        onOpenAnalytics={() => router.push(ANALYTICS_ROUTE)}
        onOpenBoard={() => openBoard(activeBoard.id)}
        onOpenCalendar={() => router.push(CALENDAR_ROUTE)}
        onOpenCommands={openCommandPalette}
        onOpenMyWork={() => router.push(MY_WORK_ROUTE)}
        onOpenNotes={() => router.push(NOTES_ROUTE)}
        onOpenWorkspaceData={() => setIsNotesDataOpen(true)}
        onRedo={redoActiveNote}
        showProjectsButton={false}
        onToggleProjects={() => setIsProjectsOpen((current) => !current)}
        onUndo={undoActiveNote}
        workspaceDataLabel="Backup заметок"
      >
        <ProjectSwitcher
          activeBoard={activeBoard}
          boards={workspace.boards}
          isOpen={isProjectsOpen}
          onCreateBoard={createProjectFromHeader}
          onDeleteBoard={deleteProjectFromHeader}
          onOpenChange={setIsProjectsOpen}
          onSelectBoard={selectProjectFromHeader}
        />
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
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

          <div className="grid min-h-0 flex-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <NotesSidebar
              activeNoteId={activeNote.id}
              notes={filteredBoardNotes}
              searchQuery={noteSearchQuery}
              onAddNote={addNote}
              onDeleteNote={setDeleteNoteId}
              onSearchChange={setNoteSearchQuery}
              onSelectNote={setActiveNoteId}
            />

            <section className="min-h-0 overflow-y-auto">
              <div className="border-b border-white/10 bg-panel/70 px-4 py-3 lg:hidden">
                <div className="flex items-center gap-2">
                  <NoteSwitcher
                    activeNote={activeNote}
                    isOpen={isNoteSwitcherOpen}
                    notes={boardNotes}
                    onDelete={setDeleteNoteId}
                    onOpenChange={setIsNoteSwitcherOpen}
                    onSelect={setActiveNoteId}
                  />
                  <Button size="sm" onClick={addNote}>
                    <Plus aria-hidden="true" size={16} />
                    Новая
                  </Button>
                </div>
              </div>
              <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-8">
                <div className="flex items-start gap-2">
                  <TextField
                    aria-label="Название заметки"
                    className="h-auto border-0 bg-transparent px-0 py-1 text-4xl font-semibold leading-tight text-text shadow-none focus:border-0"
                    value={activeNote.title}
                    onChange={(event) =>
                      patchActiveNote({ title: event.currentTarget.value })
                    }
                    onBlur={(event) =>
                      patchActiveNote({
                        title:
                          event.currentTarget.value.trim() || "Без названия",
                      })
                    }
                  />
                </div>
              </div>

              <NotesEditor
                activeBoard={activeBoard}
                blocks={activeNote.blocks}
                onChange={(blocks) => patchActiveNote({ blocks })}
                onCreateTask={createTaskFromNote}
                onOpenCard={(cardId) => {
                  selectProject(activeBoard.id);
                  router.push(getBoardRoute(activeBoard.id, cardId));
                }}
              />
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
              const nextNotes = currentNotes.filter(
                (note) => note.id !== deleteNoteId,
              );
              const nextBoardNotes = nextNotes.filter(
                (note) => note.boardId === activeBoard.id,
              );

              if (nextBoardNotes.length > 0) {
                setActiveNoteId(nextBoardNotes[0]?.id ?? null);
                return nextNotes;
              }

              const fallbackNote = createNote(activeBoard.id);
              setActiveNoteId(fallbackNote.id);
              return [fallbackNote, ...nextNotes];
            });
          }
          setDeleteNoteId(null);
        }}
      />

      {isNotesDataOpen ? (
        <NotesDataModal
          activeNote={activeNote}
          isOpen={isNotesDataOpen}
          notes={boardNotes}
          onClose={() => setIsNotesDataOpen(false)}
          onReplaceNotes={(nextNotes) => {
            const scopedNotes = nextNotes.map((note) => ({
              ...note,
              boardId: activeBoard.id,
            }));
            setNotes((currentNotes) => [
              ...scopedNotes,
              ...currentNotes.filter((note) => note.boardId !== activeBoard.id),
            ]);
            setActiveNoteId(scopedNotes[0]?.id ?? null);
          }}
        />
      ) : null}
      {isCommandPaletteOpen ? (
        <CommandPalette
          actions={commandActions}
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      ) : null}
    </main>
  );
}
