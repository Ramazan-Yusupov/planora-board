"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createEmptyBoard,
  createInitialBoardWorkspace,
  deleteBoardFromWorkspace,
  getActiveBoard,
  loadBoardWorkspace,
  persistBoardWorkspaceChange,
  replaceBoardInWorkspace,
  selectBoardInWorkspace,
  type Board,
  type BoardWorkspace,
  type BoardWorkspacePersistenceChange,
} from "@/entities/board";

export type BoardPersistenceState = "loading" | "saved" | "saving" | "error";
export type BoardSaveMode = "debounced" | "immediate";

type PendingWorkspaceChange = {
  boardsToSave: Map<string, Board>;
  boardIdsToDelete: Set<string>;
  activeBoardId: string | null;
};

type UseBoardWorkspaceResult = {
  workspace: BoardWorkspace | null;
  activeBoard: Board | null;
  isReady: boolean;
  persistenceState: BoardPersistenceState;
  storageError: string | null;
  createProject: (title: string) => void;
  deleteProject: (boardId: string) => void;
  selectProject: (boardId: string) => void;
  updateActiveBoard: (
    updater: (currentBoard: Board) => Board,
    saveMode?: BoardSaveMode,
  ) => void;
};

function mergePendingChange(
  pendingChange: PendingWorkspaceChange | null,
  incomingChange: BoardWorkspacePersistenceChange,
): PendingWorkspaceChange {
  const nextChange = pendingChange ?? {
    boardsToSave: new Map<string, Board>(),
    boardIdsToDelete: new Set<string>(),
    activeBoardId: incomingChange.activeBoardId,
  };

  for (const board of incomingChange.boardsToSave) {
    nextChange.boardsToSave.set(board.id, board);
    nextChange.boardIdsToDelete.delete(board.id);
  }

  for (const boardId of incomingChange.boardIdsToDelete) {
    nextChange.boardsToSave.delete(boardId);
    nextChange.boardIdsToDelete.add(boardId);
  }

  nextChange.activeBoardId = incomingChange.activeBoardId;

  return nextChange;
}

function toPersistenceChange(
  pendingChange: PendingWorkspaceChange,
): BoardWorkspacePersistenceChange {
  return {
    boardsToSave: [...pendingChange.boardsToSave.values()],
    boardIdsToDelete: [...pendingChange.boardIdsToDelete],
    activeBoardId: pendingChange.activeBoardId,
  };
}

function getPersistenceError(error: unknown): string {
  return error instanceof Error
    ? `Изменения не сохранены: ${error.message}`
    : "Изменения не сохранены.";
}

export function useBoardWorkspace(): UseBoardWorkspaceResult {
  const [workspace, setWorkspace] = useState<BoardWorkspace | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [persistenceState, setPersistenceState] =
    useState<BoardPersistenceState>("loading");
  const [storageError, setStorageError] = useState<string | null>(null);
  const workspaceRef = useRef<BoardWorkspace | null>(null);
  const pendingChangeRef = useRef<PendingWorkspaceChange | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const latestWriteRef = useRef(0);
  const hydrationPromiseRef = useRef<Promise<{
    workspace: BoardWorkspace;
    error: string | null;
  }> | null>(null);
  const isMountedRef = useRef(true);

  const flushPendingChanges = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const pendingChange = pendingChangeRef.current;

    if (!pendingChange) {
      return;
    }

    pendingChangeRef.current = null;
    const writeVersion = latestWriteRef.current + 1;
    latestWriteRef.current = writeVersion;

    if (isMountedRef.current) {
      setPersistenceState("saving");
    }

    try {
      await persistBoardWorkspaceChange(toPersistenceChange(pendingChange));

      if (
        isMountedRef.current &&
        writeVersion === latestWriteRef.current &&
        pendingChangeRef.current === null
      ) {
        setPersistenceState("saved");
        setStorageError(null);
      }
    } catch (error) {
      if (
        isMountedRef.current &&
        writeVersion === latestWriteRef.current &&
        pendingChangeRef.current === null
      ) {
        setPersistenceState("error");
        setStorageError(getPersistenceError(error));
      }
    }
  }, []);

  const schedulePersistence = useCallback(
    (
      change: BoardWorkspacePersistenceChange,
      saveMode: BoardSaveMode = "debounced",
    ) => {
      pendingChangeRef.current = mergePendingChange(
        pendingChangeRef.current,
        change,
      );

      if (isMountedRef.current) {
        setPersistenceState("saving");
      }

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      if (saveMode === "immediate") {
        void flushPendingChanges();
        return;
      }

      saveTimerRef.current = window.setTimeout(() => {
        void flushPendingChanges();
      }, 300);
    },
    [flushPendingChanges],
  );

  const commitWorkspace = useCallback(
    (
      nextWorkspace: BoardWorkspace,
      change: BoardWorkspacePersistenceChange,
      saveMode: BoardSaveMode = "debounced",
    ) => {
      workspaceRef.current = nextWorkspace;
      setWorkspace(nextWorkspace);
      schedulePersistence(change, saveMode);
    },
    [schedulePersistence],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      void flushPendingChanges();
    };
  }, [flushPendingChanges]);

  useEffect(() => {
    let isDisposed = false;

    if (!hydrationPromiseRef.current) {
      hydrationPromiseRef.current = (async () => {
        try {
          const loadedWorkspace = await loadBoardWorkspace();

          if (loadedWorkspace.boards.length > 0) {
            return { workspace: loadedWorkspace, error: null };
          }

          const initialWorkspace = createInitialBoardWorkspace();

          await persistBoardWorkspaceChange({
            boardsToSave: initialWorkspace.boards,
            boardIdsToDelete: [],
            activeBoardId: initialWorkspace.activeBoardId,
          });

          return { workspace: initialWorkspace, error: null };
        } catch (error) {
          return {
            workspace: createInitialBoardWorkspace(),
            error:
              error instanceof Error
                ? `Не удалось открыть локальное хранилище: ${error.message}`
                : "Не удалось открыть локальное хранилище.",
          };
        }
      })();
    }

    void hydrationPromiseRef.current.then((result) => {
      if (isDisposed) {
        return;
      }

      workspaceRef.current = result.workspace;
      setWorkspace(result.workspace);
      setStorageError(result.error);
      setPersistenceState(result.error ? "error" : "saved");
      setIsReady(true);
    });

    return () => {
      isDisposed = true;
    };
  }, []);

  const updateActiveBoard = useCallback(
    (
      updater: (currentBoard: Board) => Board,
      saveMode: BoardSaveMode = "debounced",
    ) => {
      const currentWorkspace = workspaceRef.current;

      if (!currentWorkspace) {
        return;
      }

      const currentBoard = getActiveBoard(currentWorkspace);

      if (!currentBoard) {
        return;
      }

      const nextBoard = updater(currentBoard);

      if (nextBoard === currentBoard) {
        return;
      }

      const nextWorkspace = replaceBoardInWorkspace(currentWorkspace, nextBoard);

      commitWorkspace(
        nextWorkspace,
        {
          boardsToSave: [nextBoard],
          boardIdsToDelete: [],
          activeBoardId: nextWorkspace.activeBoardId,
        },
        saveMode,
      );
    },
    [commitWorkspace],
  );

  const createProject = useCallback(
    (title: string) => {
      const currentWorkspace = workspaceRef.current;

      if (!currentWorkspace) {
        return;
      }

      const nextBoard = createEmptyBoard(title);
      const nextWorkspace: BoardWorkspace = {
        boards: [...currentWorkspace.boards, nextBoard],
        activeBoardId: nextBoard.id,
      };

      commitWorkspace(
        nextWorkspace,
        {
          boardsToSave: [nextBoard],
          boardIdsToDelete: [],
          activeBoardId: nextBoard.id,
        },
        "immediate",
      );
    },
    [commitWorkspace],
  );

  const selectProject = useCallback(
    (boardId: string) => {
      const currentWorkspace = workspaceRef.current;

      if (!currentWorkspace || currentWorkspace.activeBoardId === boardId) {
        return;
      }

      const nextWorkspace = selectBoardInWorkspace(currentWorkspace, boardId);

      if (nextWorkspace === currentWorkspace) {
        return;
      }

      commitWorkspace(
        nextWorkspace,
        {
          boardsToSave: [],
          boardIdsToDelete: [],
          activeBoardId: nextWorkspace.activeBoardId,
        },
      );
    },
    [commitWorkspace],
  );

  const deleteProject = useCallback(
    (boardId: string) => {
      const currentWorkspace = workspaceRef.current;

      if (!currentWorkspace) {
        return;
      }

      const deletion = deleteBoardFromWorkspace(currentWorkspace, boardId);

      if (deletion.workspace === currentWorkspace) {
        return;
      }

      commitWorkspace(
        deletion.workspace,
        {
          boardsToSave: deletion.createdBoard ? [deletion.createdBoard] : [],
          boardIdsToDelete: [boardId],
          activeBoardId: deletion.workspace.activeBoardId,
        },
        "immediate",
      );
    },
    [commitWorkspace],
  );

  return {
    workspace,
    activeBoard: workspace ? getActiveBoard(workspace) : null,
    isReady,
    persistenceState,
    storageError,
    createProject,
    deleteProject,
    selectProject,
    updateActiveBoard,
  };
}
