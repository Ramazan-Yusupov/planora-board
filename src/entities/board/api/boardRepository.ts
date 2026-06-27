import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import { boardSchema } from "../model/schemas";
import type { Board } from "../model/types";

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
const DATABASE_VERSION = 1;
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

export async function loadActiveBoard(): Promise<Board | null> {
  const database = await getDatabase();
  const metadata = await database.get("metadata", ACTIVE_BOARD_KEY);

  if (metadata) {
    const activeBoard = await database.get("boards", metadata.value);
    if (activeBoard) {
      return boardSchema.parse(activeBoard);
    }
  }

  const boards = await database.getAll("boards");
  const firstBoard = boards.at(0);
  return firstBoard ? boardSchema.parse(firstBoard) : null;
}

export async function saveActiveBoard(board: Board): Promise<void> {
  const validatedBoard = boardSchema.parse(board);
  const database = await getDatabase();
  const transaction = database.transaction(["boards", "metadata"], "readwrite");

  await Promise.all([
    transaction.objectStore("boards").put(validatedBoard),
    transaction.objectStore("metadata").put({
      key: ACTIVE_BOARD_KEY,
      value: validatedBoard.id,
    }),
    transaction.done,
  ]);
}
