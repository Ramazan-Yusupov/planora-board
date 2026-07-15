"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  activateFolderWorkspaceHandle,
  clearActiveFolderWorkspace,
  clearPersistedWorkspaceFolderHandle,
  createActiveFolderBackup,
  createBoardFromTemplate,
  createInitialBoardWorkspace,
  deleteAttachmentBlobs,
  deleteBoardFromWorkspace,
  getActiveBoard,
  getRemovedAttachmentIds,
  getWorkspaceFolderPermission,
  getWorkspacePersistenceChange,
  initializeFolderWorkspace,
  isAbortError,
  isWorkspaceFolderStorageSupported,
  loadBoardWorkspace,
  loadPersistedWorkspaceFolderHandle,
  persistBoardWorkspaceChange,
  pickWorkspaceFolder,
  readFolderWorkspace,
  requestWorkspaceFolderPermission,
  replaceBoardInWorkspace,
  saveActiveFolderWorkspace,
  savePersistedWorkspaceFolderHandle,
  selectBoardInWorkspace,
  toWorkspaceStorageInfo,
  type Board,
  type BoardProjectTemplateId,
  type BoardWorkspace,
  type BoardWorkspacePersistenceChange,
  type WorkspaceFolderStorageInfo,
} from "@/entities/board";
import {
  createHistory,
  pushHistory,
  takeRedo,
  takeUndo,
  type HistoryState,
} from "@/features/undo-redo";

export type BoardPersistenceState = "loading" | "saved" | "saving" | "error";
export type BoardSaveMode = "debounced" | "immediate";

type PendingWorkspaceChange = {
  boardsToSave: Map<string, Board>;
  boardIdsToDelete: Set<string>;
  activeBoardId: string | null;
};

type HydratedWorkspaceResult = Readonly<{
  error: string | null;
  storageInfo: WorkspaceFolderStorageInfo;
  workspace: BoardWorkspace;
}>;

type UseBoardWorkspaceResult = {
  workspace: BoardWorkspace | null;
  activeBoard: Board | null;
  isReady: boolean;
  persistenceState: BoardPersistenceState;
  storageError: string | null;
  workspaceStorage: WorkspaceFolderStorageInfo;
  isWorkspaceStorageBusy: boolean;
  canUndo: boolean;
  canRedo: boolean;
  connectWorkspaceFolder: () => Promise<void>;
  createFolderBackup: () => Promise<void>;
  createProject: (
    title: string,
    templateId?: BoardProjectTemplateId,
  ) => string | null;
  deleteProject: (boardId: string) => string | null;
  disconnectWorkspaceFolder: () => Promise<void>;
  redo: () => void;
  replaceWorkspace: (workspace: BoardWorkspace) => void;
  selectProject: (boardId: string) => void;
  undo: () => void;
  updateActiveBoard: (
    updater: (currentBoard: Board) => Board,
    saveMode?: BoardSaveMode,
  ) => void;
  updateBoard: (
    boardId: string,
    updater: (currentBoard: Board) => Board,
    saveMode?: BoardSaveMode,
  ) => void;
};

function createBrowserStorageInfo(): WorkspaceFolderStorageInfo {
  return {
    isConnected: false,
    isSupported: isWorkspaceFolderStorageSupported(),
    kind: "browser",
  };
}

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

function resetHistory(): HistoryState<BoardWorkspace> {
  return createHistory();
}

export function useBoardWorkspace(): UseBoardWorkspaceResult {
  const [workspace, setWorkspace] = useState<BoardWorkspace | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [persistenceState, setPersistenceState] =
    useState<BoardPersistenceState>("loading");
  const [storageError, setStorageError] = useState<string | null>(null);
  const [workspaceStorage, setWorkspaceStorage] =
    useState<WorkspaceFolderStorageInfo>(createBrowserStorageInfo);
  const [isWorkspaceStorageBusy, setIsWorkspaceStorageBusy] = useState(false);
  const [historyState, setHistoryState] = useState<HistoryState<BoardWorkspace>>(
    createHistory,
  );
  const workspaceRef = useRef<BoardWorkspace | null>(null);
  const historyRef = useRef<HistoryState<BoardWorkspace>>(createHistory());
  const pendingChangeRef = useRef<PendingWorkspaceChange | null>(null);
  const pendingAttachmentBlobDeletesRef = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<number | null>(null);
  const latestWriteRef = useRef(0);
  const hydrationPromiseRef = useRef<Promise<HydratedWorkspaceResult> | null>(
    null,
  );
  const isMountedRef = useRef(true);

  const updateHistoryState = useCallback(
    (nextHistory: HistoryState<BoardWorkspace>) => {
      historyRef.current = nextHistory;
      setHistoryState(nextHistory);
    },
    [],
  );

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
    const workspaceSnapshot = workspaceRef.current;
    const attachmentIdsToDelete = [
      ...pendingAttachmentBlobDeletesRef.current,
    ];
    pendingAttachmentBlobDeletesRef.current.clear();
    const writeVersion = latestWriteRef.current + 1;
    latestWriteRef.current = writeVersion;

    if (isMountedRef.current) {
      setPersistenceState("saving");
    }

    try {
      await persistBoardWorkspaceChange(toPersistenceChange(pendingChange));

      // IndexedDB остаётся кэшем и fallback. Если подключена папка, полный
      // snapshot сохраняется туда после успешного локального обновления.
      if (workspaceSnapshot) {
        await saveActiveFolderWorkspace(workspaceSnapshot);
      }

      await deleteAttachmentBlobs(attachmentIdsToDelete);

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
      recordHistory = true,
    ) => {
      const currentWorkspace = workspaceRef.current;

      if (recordHistory && currentWorkspace) {
        updateHistoryState(pushHistory(historyRef.current, currentWorkspace));
      }

      if (currentWorkspace) {
        for (const attachmentId of getRemovedAttachmentIds(
          currentWorkspace,
          nextWorkspace,
        )) {
          pendingAttachmentBlobDeletesRef.current.add(attachmentId);
        }
      }

      workspaceRef.current = nextWorkspace;
      setWorkspace(nextWorkspace);
      schedulePersistence(change, saveMode);
    },
    [schedulePersistence, updateHistoryState],
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
      hydrationPromiseRef.current = (async (): Promise<HydratedWorkspaceResult> => {
        try {
          const cachedWorkspace = await loadBoardWorkspace();
          const folderHandle = await loadPersistedWorkspaceFolderHandle();
          const folderPermission = folderHandle
            ? await getWorkspaceFolderPermission(folderHandle)
            : undefined;
          let nextWorkspace = cachedWorkspace;
          let nextStorageInfo = toWorkspaceStorageInfo(
            folderHandle,
            folderPermission,
          );

          if (nextWorkspace.boards.length === 0) {
            nextWorkspace = createInitialBoardWorkspace();
            await persistBoardWorkspaceChange({
              boardsToSave: nextWorkspace.boards,
              boardIdsToDelete: [],
              activeBoardId: nextWorkspace.activeBoardId,
            });
          }

          if (folderHandle && folderPermission === "granted") {
            const folderSnapshot = await readFolderWorkspace(folderHandle);
            const nextFolderSnapshot =
              folderSnapshot ??
              (await initializeFolderWorkspace(folderHandle, nextWorkspace));

            activateFolderWorkspaceHandle(folderHandle, nextFolderSnapshot);
            nextStorageInfo = toWorkspaceStorageInfo(folderHandle, "granted");

            if (folderSnapshot) {
              nextWorkspace = folderSnapshot.workspace;
              await persistBoardWorkspaceChange(
                getWorkspacePersistenceChange(cachedWorkspace, nextWorkspace),
              );
            }
          }


          return {
            workspace: nextWorkspace,
            error: null,
            storageInfo: nextStorageInfo,
          };
        } catch (error) {
          return {
            workspace: createInitialBoardWorkspace(),
            error:
              error instanceof Error
                ? `Не удалось открыть локальное хранилище: ${error.message}`
                : "Не удалось открыть локальное хранилище.",
            storageInfo: createBrowserStorageInfo(),
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
      setWorkspaceStorage(result.storageInfo);
      setStorageError(result.error);
      setPersistenceState(result.error ? "error" : "saved");
      setIsReady(true);
    });

    return () => {
      isDisposed = true;
    };
  }, []);

  const connectWorkspaceFolder = useCallback(async () => {
    const currentWorkspace = workspaceRef.current;

    if (!currentWorkspace) {
      return;
    }

    // showDirectoryPicker должен вызываться прямо из обработчика клика.
    // Поэтому не ждём autosave до открытия системного диалога папки.
    let folderHandle;

    try {
      folderHandle = await pickWorkspaceFolder();
    } catch (error) {
      if (!isAbortError(error)) {
        setPersistenceState("error");
        setStorageError(getPersistenceError(error));
      }
      return;
    }

    setIsWorkspaceStorageBusy(true);
    setStorageError(null);

    try {
      await flushPendingChanges();

      let permission = await getWorkspaceFolderPermission(folderHandle);

      if (permission !== "granted") {
        permission = await requestWorkspaceFolderPermission(folderHandle);
      }

      if (permission !== "granted") {
        throw new Error("Нужен доступ к выбранной папке для чтения и записи.");
      }

      const folderSnapshot = await readFolderWorkspace(folderHandle);
      const nextSnapshot =
        folderSnapshot ??
        (await initializeFolderWorkspace(folderHandle, currentWorkspace));
      const nextWorkspace = nextSnapshot.workspace;

      activateFolderWorkspaceHandle(folderHandle, nextSnapshot);
      await savePersistedWorkspaceFolderHandle(folderHandle);

      if (folderSnapshot) {
        await persistBoardWorkspaceChange(
          getWorkspacePersistenceChange(currentWorkspace, nextWorkspace),
        );
        workspaceRef.current = nextWorkspace;
        setWorkspace(nextWorkspace);
        updateHistoryState(resetHistory());
      }

      setWorkspaceStorage(toWorkspaceStorageInfo(folderHandle, "granted"));
      setPersistenceState("saved");
    } catch (error) {
      if (!isAbortError(error)) {
        setPersistenceState("error");
        setStorageError(getPersistenceError(error));
      }
    } finally {
      if (isMountedRef.current) {
        setIsWorkspaceStorageBusy(false);
      }
    }
  }, [flushPendingChanges, updateHistoryState]);

  const disconnectWorkspaceFolder = useCallback(async () => {
    setIsWorkspaceStorageBusy(true);

    try {
      await flushPendingChanges();
      clearActiveFolderWorkspace();
      await clearPersistedWorkspaceFolderHandle();
      setWorkspaceStorage(createBrowserStorageInfo());
      setStorageError(null);
      setPersistenceState("saved");
    } catch (error) {
      setPersistenceState("error");
      setStorageError(getPersistenceError(error));
    } finally {
      if (isMountedRef.current) {
        setIsWorkspaceStorageBusy(false);
      }
    }
  }, [flushPendingChanges]);

  const createFolderBackup = useCallback(async () => {
    setIsWorkspaceStorageBusy(true);

    try {
      await flushPendingChanges();
      const backupFileName = await createActiveFolderBackup();

      if (!backupFileName) {
        throw new Error("Сначала подключите папку хранилища.");
      }

      setStorageError(null);
      setPersistenceState("saved");
    } catch (error) {
      setPersistenceState("error");
      setStorageError(getPersistenceError(error));
    } finally {
      if (isMountedRef.current) {
        setIsWorkspaceStorageBusy(false);
      }
    }
  }, [flushPendingChanges]);

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

  const updateBoard = useCallback(
    (
      boardId: string,
      updater: (currentBoard: Board) => Board,
      saveMode: BoardSaveMode = "debounced",
    ) => {
      const currentWorkspace = workspaceRef.current;

      if (!currentWorkspace) {
        return;
      }

      const currentBoard = currentWorkspace.boards.find(
        (board) => board.id === boardId,
      );

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
    (
      title: string,
      templateId: BoardProjectTemplateId = "blank",
    ): string | null => {
      const currentWorkspace = workspaceRef.current;

      if (!currentWorkspace) {
        return null;
      }

      const nextBoard = createBoardFromTemplate(title, templateId);
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

      return nextBoard.id;
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
        "debounced",
        false,
      );
    },
    [commitWorkspace],
  );

  const deleteProject = useCallback(
    (boardId: string): string | null => {
      const currentWorkspace = workspaceRef.current;

      if (!currentWorkspace) {
        return null;
      }

      const deletion = deleteBoardFromWorkspace(currentWorkspace, boardId);

      if (deletion.workspace === currentWorkspace) {
        return null;
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

      return deletion.workspace.activeBoardId;
    },
    [commitWorkspace],
  );

  const replaceWorkspace = useCallback(
    (nextWorkspace: BoardWorkspace) => {
      const currentWorkspace = workspaceRef.current;

      if (!currentWorkspace) {
        return;
      }

      commitWorkspace(
        nextWorkspace,
        getWorkspacePersistenceChange(currentWorkspace, nextWorkspace),
        "immediate",
      );
    },
    [commitWorkspace],
  );

  const undo = useCallback(() => {
    const currentWorkspace = workspaceRef.current;

    if (!currentWorkspace) {
      return;
    }

    const result = takeUndo(historyRef.current, currentWorkspace);

    if (!result.snapshot) {
      return;
    }

    updateHistoryState(result.state);
    commitWorkspace(
      result.snapshot,
      getWorkspacePersistenceChange(currentWorkspace, result.snapshot),
      "immediate",
      false,
    );
  }, [commitWorkspace, updateHistoryState]);

  const redo = useCallback(() => {
    const currentWorkspace = workspaceRef.current;

    if (!currentWorkspace) {
      return;
    }

    const result = takeRedo(historyRef.current, currentWorkspace);

    if (!result.snapshot) {
      return;
    }

    updateHistoryState(result.state);
    commitWorkspace(
      result.snapshot,
      getWorkspacePersistenceChange(currentWorkspace, result.snapshot),
      "immediate",
      false,
    );
  }, [commitWorkspace, updateHistoryState]);

  return {
    workspace,
    activeBoard: workspace ? getActiveBoard(workspace) : null,
    isReady,
    persistenceState,
    storageError,
    workspaceStorage,
    isWorkspaceStorageBusy,
    canUndo: historyState.past.length > 0,
    canRedo: historyState.future.length > 0,
    connectWorkspaceFolder,
    createFolderBackup,
    createProject,
    deleteProject,
    disconnectWorkspaceFolder,
    redo,
    replaceWorkspace,
    selectProject,
    undo,
    updateActiveBoard,
    updateBoard,
  };
}
