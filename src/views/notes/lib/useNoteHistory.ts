"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type { Note } from "@/features/manage-notes";

import {
  areNoteSnapshotsEqual,
  cloneNoteBlocks,
  createNoteSnapshot,
  type NoteHistoryState,
  type NoteSnapshot,
} from "./notesEditorModel";

type UseNoteHistoryParams = Readonly<{
  activeNote: Note | undefined;
  isBlocked: boolean;
  setNotes: Dispatch<SetStateAction<Note[]>>;
}>;

export function useNoteHistory({
  activeNote,
  isBlocked,
  setNotes,
}: UseNoteHistoryParams) {
  const noteHistoryRef = useRef<NoteHistoryState>({
    future: [],
    noteId: null,
    past: [],
  });
  const [historyCapabilities, setHistoryCapabilities] = useState({
    canRedo: false,
    canUndo: false,
    noteId: null as string | null,
  });

  const bumpHistoryVersion = useCallback(() => {
    const history = noteHistoryRef.current;

    setHistoryCapabilities({
      canRedo: history.future.length > 0,
      canUndo: history.past.length > 0,
      noteId: history.noteId,
    });
  }, []);

  const applyNoteSnapshot = useCallback((noteId: string, snapshot: NoteSnapshot) => {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              blocks: cloneNoteBlocks(snapshot.blocks),
              dueDate: snapshot.dueDate,
              linkedBoardId: snapshot.linkedBoardId,
              linkedCardId: snapshot.linkedCardId,
              status: snapshot.status,
              tags: [...snapshot.tags],
              title: snapshot.title,
              updatedAt: Date.now(),
            }
          : note,
      ),
    );
  }, [setNotes]);

  const recordActiveNoteHistory = useCallback(() => {
    if (!activeNote) {
      return;
    }

    const snapshot = createNoteSnapshot(activeNote);
    const history = noteHistoryRef.current;
    const past = history.noteId === activeNote.id ? history.past : [];
    const lastSnapshot = past.at(-1);

    if (lastSnapshot && areNoteSnapshotsEqual(lastSnapshot, snapshot)) {
      return;
    }

    noteHistoryRef.current = {
      future: [],
      noteId: activeNote.id,
      past: [...past, snapshot].slice(-50),
    };
    bumpHistoryVersion();
  }, [activeNote, bumpHistoryVersion]);

  const undoActiveNote = useCallback(() => {
    if (!activeNote) {
      return;
    }

    const history = noteHistoryRef.current;
    const previousSnapshot = history.past.at(-1);

    if (history.noteId !== activeNote.id || !previousSnapshot) {
      return;
    }

    noteHistoryRef.current = {
      future: [createNoteSnapshot(activeNote), ...history.future].slice(0, 50),
      noteId: activeNote.id,
      past: history.past.slice(0, -1),
    };
    applyNoteSnapshot(activeNote.id, previousSnapshot);
    bumpHistoryVersion();
  }, [activeNote, applyNoteSnapshot, bumpHistoryVersion]);

  const redoActiveNote = useCallback(() => {
    if (!activeNote) {
      return;
    }

    const history = noteHistoryRef.current;
    const nextSnapshot = history.future[0];

    if (history.noteId !== activeNote.id || !nextSnapshot) {
      return;
    }

    noteHistoryRef.current = {
      future: history.future.slice(1),
      noteId: activeNote.id,
      past: [...history.past, createNoteSnapshot(activeNote)].slice(-50),
    };
    applyNoteSnapshot(activeNote.id, nextSnapshot);
    bumpHistoryVersion();
  }, [activeNote, applyNoteSnapshot, bumpHistoryVersion]);

  useEffect(() => {
    const handleHistoryShortcut = (event: globalThis.KeyboardEvent) => {
      if (isBlocked) {
        return;
      }

      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        redoActiveNote();
        return;
      }

      undoActiveNote();
    };

    window.addEventListener("keydown", handleHistoryShortcut);

    return () => {
      window.removeEventListener("keydown", handleHistoryShortcut);
    };
  }, [isBlocked, redoActiveNote, undoActiveNote]);

  return {
    canRedoActiveNote:
      historyCapabilities.noteId === activeNote?.id && historyCapabilities.canRedo,
    canUndoActiveNote:
      historyCapabilities.noteId === activeNote?.id && historyCapabilities.canUndo,
    recordActiveNoteHistory,
    redoActiveNote,
    undoActiveNote,
  };
}
