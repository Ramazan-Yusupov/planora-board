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

const DATABASE_NAME = "planora-board-db";
const DATABASE_VERSION = 2;
const ACTIVE_BOARD_KEY = "activeBoardId";

let databasePromise: Promise<IDBPDatabase<PlanoraDatabase>> | null = null;

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

export async function loadBoardWorkspace(): Promise<BoardWorkspace> {
  const database = await getDatabase();
  const [storedBoards, metadata] = await Promise.all([
    database.getAll("boards"),
    database.get("metadata", ACTIVE_BOARD_KEY),
  ]);
  const boards = storedBoards.map(parseBoard).sort((first, second) => first.createdAt - second.createdAt);
  const requestedActiveBoardId = metadata?.value;
  const activeBoardId = boards.some((board) => board.id === requestedActiveBoardId)
    ? requestedActiveBoardId ?? null
    : boards.at(0)?.id ?? null;

  return { boards, activeBoardId };
}

export async function saveBoardWorkspace(workspace: BoardWorkspace): Promise<void> {
  const boards = workspace.boards.map(parseBoard);
  const boardIds = new Set(boards.map((board) => board.id));
  const activeBoardId = boardIds.has(workspace.activeBoardId ?? "") ? workspace.activeBoardId : boards.at(0)?.id ?? null;
  const database = await getDatabase();
  const transaction = database.transaction(["boards", "metadata"], "readwrite");
  const boardStore = transaction.objectStore("boards");
  const metadataStore = transaction.objectStore("metadata");
  const existingBoardIds = await boardStore.getAllKeys();

  for (const id of existingBoardIds) {
    if (!boardIds.has(id)) {
      await boardStore.delete(id);
    }
  }

  for (const board of boards) {
    await boardStore.put(board);
  }

  await metadataStore.put({
    key: ACTIVE_BOARD_KEY,
    value: activeBoardId ?? "",
  });
  await transaction.done;
}
