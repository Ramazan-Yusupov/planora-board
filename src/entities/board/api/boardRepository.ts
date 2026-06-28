import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import { DEFAULT_BOARD_APPEARANCE } from "../lib/appearance";
import { boardSchema } from "../model/schemas";
import type { Board, BoardWorkspace } from "../model/types";

interface PlanoraDatabase extends DBSchema {
  boards: {
    key: string;
    value: Board;
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: string;
    };
  };
}

export type BoardWorkspacePersistenceChange = Readonly<{
  boardsToSave: readonly Board[];
  boardIdsToDelete: readonly string[];
  activeBoardId: string | null;
}>;

const DATABASE_NAME = "planora-board-db";
const DATABASE_VERSION = 3;
const ACTIVE_BOARD_KEY = "activeBoardId";

let databasePromise: Promise<IDBPDatabase<PlanoraDatabase>> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function getDatabase(): Promise<IDBPDatabase<PlanoraDatabase>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB доступен только в браузере.");
  }

  if (!databasePromise) {
    databasePromise = openDB<PlanoraDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("boards")) {
          database.createObjectStore("boards", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("metadata")) {
          database.createObjectStore("metadata", { keyPath: "key" });
        }
      },
    });
  }

  return databasePromise;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateBoard(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  if (isRecord(value.appearance)) {
    return value;
  }

  return {
    ...value,
    appearance: { ...DEFAULT_BOARD_APPEARANCE },
  };
}

function parseBoard(value: unknown): Board {
  return boardSchema.parse(migrateBoard(value));
}

function queueWrite(task: () => Promise<void>): Promise<void> {
  const nextWrite = writeQueue.then(task, task);

  // Ошибка предыдущего сохранения не должна блокировать следующие изменения.
  writeQueue = nextWrite.catch(() => undefined);

  return nextWrite;
}

function normalizeChange(
  change: BoardWorkspacePersistenceChange,
): BoardWorkspacePersistenceChange {
  const boardsById = new Map(
    change.boardsToSave.map((board) => [board.id, parseBoard(board)]),
  );
  const boardIdsToDelete = new Set(change.boardIdsToDelete);

  for (const boardId of boardsById.keys()) {
    boardIdsToDelete.delete(boardId);
  }

  return {
    boardsToSave: [...boardsById.values()],
    boardIdsToDelete: [...boardIdsToDelete],
    activeBoardId: change.activeBoardId,
  };
}

export async function loadBoardWorkspace(): Promise<BoardWorkspace> {
  const database = await getDatabase();
  const [storedBoards, metadata] = await Promise.all([
    database.getAll("boards"),
    database.get("metadata", ACTIVE_BOARD_KEY),
  ]);
  const boards = storedBoards
    .map(parseBoard)
    .sort((first, second) => first.createdAt - second.createdAt);
  const requestedActiveBoardId = metadata?.value;
  const activeBoardId = boards.some((board) => board.id === requestedActiveBoardId)
    ? requestedActiveBoardId ?? null
    : boards.at(0)?.id ?? null;

  return { boards, activeBoardId };
}

export function persistBoardWorkspaceChange(
  change: BoardWorkspacePersistenceChange,
): Promise<void> {
  const normalizedChange = normalizeChange(change);

  return queueWrite(async () => {
    const database = await getDatabase();
    const transaction = database.transaction(["boards", "metadata"], "readwrite");
    const boardStore = transaction.objectStore("boards");
    const metadataStore = transaction.objectStore("metadata");

    for (const boardId of normalizedChange.boardIdsToDelete) {
      await boardStore.delete(boardId);
    }

    for (const board of normalizedChange.boardsToSave) {
      await boardStore.put(board);
    }

    await metadataStore.put({
      key: ACTIVE_BOARD_KEY,
      value: normalizedChange.activeBoardId ?? "",
    });
    await transaction.done;
  });
}
