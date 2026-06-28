import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import {
  deleteFolderAttachments,
  loadFolderAttachment,
  saveFolderAttachment,
  type WorkspaceFolderHandle,
} from "./folderStorage";

import { DEFAULT_BOARD_APPEARANCE } from "../lib/appearance";
import {
  createDefaultBoardLabelCollection,
  LEGACY_LABEL_ID_BY_VALUE,
} from "../lib/labels";
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
  attachmentBlobs: {
    key: string;
    value: {
      id: string;
      blob: Blob;
    };
  };
  workspaceFolderHandles: {
    key: string;
    value: {
      key: string;
      handle: WorkspaceFolderHandle;
      name: string;
      updatedAt: number;
    };
  };
}

export type BoardWorkspacePersistenceChange = Readonly<{
  boardsToSave: readonly Board[];
  boardIdsToDelete: readonly string[];
  activeBoardId: string | null;
}>;

const DATABASE_NAME = "planora-board-db";
const DATABASE_VERSION = 6;
const ACTIVE_BOARD_KEY = "activeBoardId";
const ACTIVE_FOLDER_HANDLE_KEY = "activeWorkspaceFolder";

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

        if (!database.objectStoreNames.contains("attachmentBlobs")) {
          database.createObjectStore("attachmentBlobs", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("workspaceFolderHandles")) {
          database.createObjectStore("workspaceFolderHandles", { keyPath: "key" });
        }
      },
    });
  }

  return databasePromise;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function getMigrationTimestamp(value: Record<string, unknown>): number {
  return typeof value.updatedAt === "number"
    ? value.updatedAt
    : typeof value.createdAt === "number"
      ? value.createdAt
      : Date.now();
}

function migrateBoard(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const timestamp = getMigrationTimestamp(value);
  const defaultLabels = createDefaultBoardLabelCollection(timestamp);
  const labels: Record<string, unknown> = isRecord(value.labels)
    ? value.labels
    : defaultLabels.labels;
  const hasLabels = isRecord(value.labels);
  const labelIds = isStringArray(value.labelIds)
    ? value.labelIds
    : hasLabels
      ? Object.keys(labels)
      : defaultLabels.labelIds;
  const cards = isRecord(value.cards)
    ? Object.fromEntries(
        Object.entries(value.cards).map(([cardId, cardValue]) => {
          if (!isRecord(cardValue)) {
            return [cardId, cardValue];
          }

          const legacyLabel = cardValue.label;
          const labelIdsForCard = isStringArray(cardValue.labelIds)
            ? cardValue.labelIds
            : legacyLabel === "blue" ||
                legacyLabel === "violet" ||
                legacyLabel === "orange" ||
                legacyLabel === "green"
              ? [LEGACY_LABEL_ID_BY_VALUE[legacyLabel]]
              : [];
          const cardWithoutLegacyLabel = { ...cardValue };
          delete cardWithoutLegacyLabel.label;

          return [
            cardId,
            {
              ...cardWithoutLegacyLabel,
              labelIds: labelIdsForCard,
              checklistIds: isStringArray(cardValue.checklistIds)
                ? cardValue.checklistIds
                : [],
              attachmentIds: isStringArray(cardValue.attachmentIds)
                ? cardValue.attachmentIds
                : [],
            },
          ];
        }),
      )
    : value.cards;
  const lists = isRecord(value.lists)
    ? Object.fromEntries(
        Object.entries(value.lists).map(([listId, listValue]) => {
          if (!isRecord(listValue)) {
            return [listId, listValue];
          }

          return [
            listId,
            {
              ...listValue,
              isArchived:
                typeof listValue.isArchived === "boolean"
                  ? listValue.isArchived
                  : false,
              ...(typeof listValue.isArchived === "boolean" ||
              listValue.archivedAt === undefined
                ? {}
                : { archivedAt: undefined }),
            },
          ];
        }),
      )
    : value.lists;

  return {
    ...value,
    appearance: isRecord(value.appearance)
      ? value.appearance
      : { ...DEFAULT_BOARD_APPEARANCE },
    labels,
    labelIds,
    cards,
    lists,
    checklistIds: isStringArray(value.checklistIds) ? value.checklistIds : [],
    checklists: isRecord(value.checklists) ? value.checklists : {},
    checklistItems: isRecord(value.checklistItems) ? value.checklistItems : {},
    attachmentIds: isStringArray(value.attachmentIds) ? value.attachmentIds : [],
    attachments: isRecord(value.attachments) ? value.attachments : {},
    activityIds: isStringArray(value.activityIds) ? value.activityIds : [],
    activities: isRecord(value.activities) ? value.activities : {},
  };
}

export function parseBoardData(value: unknown): Board {
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
    change.boardsToSave.map((board) => [board.id, parseBoardData(board)]),
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
    .map(parseBoardData)
    .sort((first, second) => first.createdAt - second.createdAt);
  const requestedActiveBoardId = metadata?.value;
  const activeBoardId = boards.some((board) => board.id === requestedActiveBoardId)
    ? requestedActiveBoardId ?? null
    : boards.at(0)?.id ?? null;

  return { boards, activeBoardId };
}

export async function loadPersistedWorkspaceFolderHandle(): Promise<WorkspaceFolderHandle | null> {
  const database = await getDatabase();
  const entry = await database.get("workspaceFolderHandles", ACTIVE_FOLDER_HANDLE_KEY);

  return entry?.handle ?? null;
}

export function savePersistedWorkspaceFolderHandle(
  handle: WorkspaceFolderHandle,
): Promise<void> {
  return queueWrite(async () => {
    const database = await getDatabase();
    await database.put("workspaceFolderHandles", {
      key: ACTIVE_FOLDER_HANDLE_KEY,
      handle,
      name: handle.name,
      updatedAt: Date.now(),
    });
  });
}

export function clearPersistedWorkspaceFolderHandle(): Promise<void> {
  return queueWrite(async () => {
    const database = await getDatabase();
    await database.delete("workspaceFolderHandles", ACTIVE_FOLDER_HANDLE_KEY);
  });
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

export function saveAttachmentBlob(attachmentId: string, blob: Blob): Promise<void> {
  return queueWrite(async () => {
    // Папка — долговременное хранилище. Кэш IndexedDB обновляем только после
    // успешной записи файла, чтобы карточка не ссылалась на несуществующее вложение.
    await saveFolderAttachment(attachmentId, blob);

    const database = await getDatabase();
    await database.put("attachmentBlobs", { id: attachmentId, blob });
  });
}

export async function loadAttachmentBlob(attachmentId: string): Promise<Blob | null> {
  try {
    const folderBlob = await loadFolderAttachment(attachmentId);

    if (folderBlob) {
      return folderBlob;
    }
  } catch {
    // При временно отозванном доступе к папке продолжаем использовать кэш.
  }

  const database = await getDatabase();
  const entry = await database.get("attachmentBlobs", attachmentId);

  return entry?.blob ?? null;
}

export function deleteAttachmentBlobs(attachmentIds: readonly string[]): Promise<void> {
  const uniqueAttachmentIds = [...new Set(attachmentIds)];

  if (uniqueAttachmentIds.length === 0) {
    return Promise.resolve();
  }

  return queueWrite(async () => {
    await deleteFolderAttachments(uniqueAttachmentIds);

    const database = await getDatabase();
    const transaction = database.transaction("attachmentBlobs", "readwrite");

    for (const attachmentId of uniqueAttachmentIds) {
      await transaction.store.delete(attachmentId);
    }

    await transaction.done;
  });
}
