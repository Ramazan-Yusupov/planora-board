import { z } from "zod";

import { createId } from "@/shared/lib";

import { boardSchema } from "../model/schemas";
import type { Board, BoardWorkspace } from "../model/types";

export const PLANORA_WORKSPACE_FILE_NAME = "planora-workspace.json";
export const PLANORA_ATTACHMENTS_DIRECTORY_NAME = "attachments";
export const PLANORA_BACKUPS_DIRECTORY_NAME = "backups";
const LAST_SAVED_BACKUP_FILE_NAME = "last-saved.json";
const FOLDER_FORMAT = "planora-workspace";
const FOLDER_SCHEMA_VERSION = 1;

export type WorkspaceFolderPermission =
  | "granted"
  | "prompt"
  | "denied"
  | "unsupported";

type FileSystemPermissionDescriptor = Readonly<{
  mode?: "read" | "readwrite";
}>;

type FileSystemWritableFileStream = Readonly<{
  write: (data: Blob | string) => Promise<void>;
  close: () => Promise<void>;
}>;

type WorkspaceFolderFileHandle = Readonly<{
  getFile: () => Promise<File>;
  createWritable: () => Promise<FileSystemWritableFileStream>;
}>;

export type WorkspaceFolderHandle = Readonly<{
  kind: "directory";
  name: string;
  getDirectoryHandle: (
    name: string,
    options?: Readonly<{ create?: boolean }>,
  ) => Promise<WorkspaceFolderHandle>;
  getFileHandle: (
    name: string,
    options?: Readonly<{ create?: boolean }>,
  ) => Promise<WorkspaceFolderFileHandle>;
  removeEntry?: (name: string) => Promise<void>;
  queryPermission?: (
    descriptor?: FileSystemPermissionDescriptor,
  ) => Promise<PermissionState>;
  requestPermission?: (
    descriptor?: FileSystemPermissionDescriptor,
  ) => Promise<PermissionState>;
}>;

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (
    options?: Readonly<{ id?: string; mode?: "read" | "readwrite" }>,
  ) => Promise<WorkspaceFolderHandle>;
};

const folderWorkspaceFileSchema = z.object({
  format: z.literal(FOLDER_FORMAT),
  schemaVersion: z.literal(FOLDER_SCHEMA_VERSION),
  workspaceId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  savedAt: z.string().datetime(),
  workspace: z.object({
    boards: z.array(z.unknown()),
    activeBoardId: z.string().min(1).nullable(),
  }),
});

export type FolderWorkspaceSnapshot = Readonly<{
  folderName: string;
  revision: number;
  savedAt: string;
  workspaceId: string;
  workspace: BoardWorkspace;
}>;

export type WorkspaceFolderStorageInfo = Readonly<{
  isConnected: boolean;
  isSupported: boolean;
  kind: "browser" | "folder";
  name?: string;
  permission?: WorkspaceFolderPermission;
}>;

type ActiveFolderSession = Readonly<{
  handle: WorkspaceFolderHandle;
  revision: number;
  workspaceId: string;
}>;

let activeFolderSession: ActiveFolderSession | null = null;
let folderWriteQueue: Promise<void> = Promise.resolve();

function queueFolderWrite(task: () => Promise<void>): Promise<void> {
  const nextWrite = folderWriteQueue.then(task, task);
  folderWriteQueue = nextWrite.catch(() => undefined);

  return nextWrite;
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotFoundError";
}

function getAttachmentFileName(attachmentId: string): string {
  return `${encodeURIComponent(attachmentId)}.blob`;
}

function normalizeWorkspace(rawWorkspace: {
  boards: unknown[];
  activeBoardId: string | null;
}): BoardWorkspace {
  const boards = rawWorkspace.boards.map((board) => boardSchema.parse(board));
  const activeBoardId = boards.some((board) => board.id === rawWorkspace.activeBoardId)
    ? rawWorkspace.activeBoardId
    : boards.at(0)?.id ?? null;

  return {
    boards,
    activeBoardId,
  };
}

function createWorkspacePayload(
  workspace: BoardWorkspace,
  workspaceId: string,
  revision: number,
) {
  return {
    format: FOLDER_FORMAT,
    schemaVersion: FOLDER_SCHEMA_VERSION,
    workspaceId,
    revision,
    savedAt: new Date().toISOString(),
    workspace,
  };
}

async function writeTextFile(
  directoryHandle: WorkspaceFolderHandle,
  fileName: string,
  content: string,
): Promise<void> {
  const fileHandle = await directoryHandle.getFileHandle(fileName, {
    create: true,
  });
  const writable = await fileHandle.createWritable();

  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

async function readTextFile(
  directoryHandle: WorkspaceFolderHandle,
  fileName: string,
): Promise<string | null> {
  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();

    return file.text();
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function writeWorkspaceBackup(
  directoryHandle: WorkspaceFolderHandle,
): Promise<void> {
  const existingWorkspace = await readTextFile(
    directoryHandle,
    PLANORA_WORKSPACE_FILE_NAME,
  );

  if (!existingWorkspace) {
    return;
  }

  const backupsDirectory = await directoryHandle.getDirectoryHandle(
    PLANORA_BACKUPS_DIRECTORY_NAME,
    { create: true },
  );

  await writeTextFile(
    backupsDirectory,
    LAST_SAVED_BACKUP_FILE_NAME,
    existingWorkspace,
  );
}

function createBackupFileName(): string {
  const safeTimestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `backup-${safeTimestamp}.json`;
}

export function isWorkspaceFolderStorageSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function";
}

export async function pickWorkspaceFolder(): Promise<WorkspaceFolderHandle> {
  const directoryPickerWindow = window as DirectoryPickerWindow;

  if (!directoryPickerWindow.showDirectoryPicker) {
    throw new Error(
      "Выбор папки поддерживается в Chrome и Edge на компьютере. В этом браузере используйте экспорт JSON.",
    );
  }

  return directoryPickerWindow.showDirectoryPicker({
    id: "planora-workspace",
    mode: "readwrite",
  });
}

export async function getWorkspaceFolderPermission(
  handle: WorkspaceFolderHandle,
): Promise<WorkspaceFolderPermission> {
  if (!handle.queryPermission) {
    return "prompt";
  }

  return handle.queryPermission({ mode: "readwrite" });
}

export async function requestWorkspaceFolderPermission(
  handle: WorkspaceFolderHandle,
): Promise<WorkspaceFolderPermission> {
  if (!handle.requestPermission) {
    return "prompt";
  }

  return handle.requestPermission({ mode: "readwrite" });
}

export async function readFolderWorkspace(
  handle: WorkspaceFolderHandle,
): Promise<FolderWorkspaceSnapshot | null> {
  const content = await readTextFile(handle, PLANORA_WORKSPACE_FILE_NAME);

  if (!content) {
    return null;
  }

  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(content);
  } catch {
    throw new Error(
      `Файл ${PLANORA_WORKSPACE_FILE_NAME} содержит некорректный JSON.`,
    );
  }

  const parsedFile = folderWorkspaceFileSchema.parse(parsedContent);
  const workspace = normalizeWorkspace(parsedFile.workspace);

  return {
    folderName: handle.name,
    revision: parsedFile.revision,
    savedAt: parsedFile.savedAt,
    workspaceId: parsedFile.workspaceId,
    workspace,
  };
}

export async function initializeFolderWorkspace(
  handle: WorkspaceFolderHandle,
  workspace: BoardWorkspace,
): Promise<FolderWorkspaceSnapshot> {
  const workspaceId = createId("workspace");
  const payload = createWorkspacePayload(workspace, workspaceId, 1);

  await writeTextFile(
    handle,
    PLANORA_WORKSPACE_FILE_NAME,
    JSON.stringify(payload, null, 2),
  );

  return {
    folderName: handle.name,
    revision: payload.revision,
    savedAt: payload.savedAt,
    workspaceId,
    workspace,
  };
}

export function activateFolderWorkspaceHandle(
  handle: WorkspaceFolderHandle,
  snapshot: FolderWorkspaceSnapshot,
): void {
  activeFolderSession = {
    handle,
    revision: snapshot.revision,
    workspaceId: snapshot.workspaceId,
  };
}

export function clearActiveFolderWorkspace(): void {
  activeFolderSession = null;
}

export function getActiveFolderWorkspaceInfo(): WorkspaceFolderStorageInfo {
  if (!activeFolderSession) {
    return {
      isConnected: false,
      isSupported: isWorkspaceFolderStorageSupported(),
      kind: "browser",
    };
  }

  return {
    isConnected: true,
    isSupported: true,
    kind: "folder",
    name: activeFolderSession.handle.name,
    permission: "granted",
  };
}

export function getActiveFolderWorkspaceHandle(): WorkspaceFolderHandle | null {
  return activeFolderSession?.handle ?? null;
}

export async function saveActiveFolderWorkspace(
  workspace: BoardWorkspace,
): Promise<FolderWorkspaceSnapshot | null> {
  if (!activeFolderSession) {
    return null;
  }

  let savedSnapshot: FolderWorkspaceSnapshot | null = null;

  await queueFolderWrite(async () => {
    // Считываем session уже внутри очереди: несколько быстрых сохранений
    // должны последовательно увеличивать revision, а не записывать одну версию.
    const session = activeFolderSession;

    if (!session) {
      return;
    }

    await writeWorkspaceBackup(session.handle);

    const nextRevision = session.revision + 1;
    const payload = createWorkspacePayload(
      workspace,
      session.workspaceId,
      nextRevision,
    );

    await writeTextFile(
      session.handle,
      PLANORA_WORKSPACE_FILE_NAME,
      JSON.stringify(payload, null, 2),
    );

    activeFolderSession = {
      ...session,
      revision: nextRevision,
    };

    savedSnapshot = {
      folderName: session.handle.name,
      revision: nextRevision,
      savedAt: payload.savedAt,
      workspaceId: session.workspaceId,
      workspace,
    };
  });

  return savedSnapshot;
}

export async function createActiveFolderBackup(): Promise<string | null> {
  const session = activeFolderSession;

  if (!session) {
    return null;
  }

  let backupFileName: string | null = null;

  await queueFolderWrite(async () => {
    const content = await readTextFile(
      session.handle,
      PLANORA_WORKSPACE_FILE_NAME,
    );

    if (!content) {
      return;
    }

    const backupsDirectory = await session.handle.getDirectoryHandle(
      PLANORA_BACKUPS_DIRECTORY_NAME,
      { create: true },
    );
    backupFileName = createBackupFileName();
    await writeTextFile(backupsDirectory, backupFileName, content);
  });

  return backupFileName;
}

export async function saveFolderAttachment(
  attachmentId: string,
  blob: Blob,
): Promise<void> {
  const session = activeFolderSession;

  if (!session) {
    return;
  }

  await queueFolderWrite(async () => {
    const attachmentsDirectory = await session.handle.getDirectoryHandle(
      PLANORA_ATTACHMENTS_DIRECTORY_NAME,
      { create: true },
    );
    const fileHandle = await attachmentsDirectory.getFileHandle(
      getAttachmentFileName(attachmentId),
      { create: true },
    );
    const writable = await fileHandle.createWritable();

    try {
      await writable.write(blob);
    } finally {
      await writable.close();
    }
  });
}

export async function loadFolderAttachment(
  attachmentId: string,
): Promise<Blob | null> {
  const session = activeFolderSession;

  if (!session) {
    return null;
  }

  try {
    const attachmentsDirectory = await session.handle.getDirectoryHandle(
      PLANORA_ATTACHMENTS_DIRECTORY_NAME,
    );
    const fileHandle = await attachmentsDirectory.getFileHandle(
      getAttachmentFileName(attachmentId),
    );
    const file = await fileHandle.getFile();

    return file;
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

export async function deleteFolderAttachments(
  attachmentIds: readonly string[],
): Promise<void> {
  const session = activeFolderSession;

  if (!session || attachmentIds.length === 0) {
    return;
  }

  await queueFolderWrite(async () => {
    let attachmentsDirectory: WorkspaceFolderHandle;

    try {
      attachmentsDirectory = await session.handle.getDirectoryHandle(
        PLANORA_ATTACHMENTS_DIRECTORY_NAME,
      );
    } catch (error) {
      if (isNotFoundError(error)) {
        return;
      }

      throw error;
    }

    for (const attachmentId of new Set(attachmentIds)) {
      try {
        await attachmentsDirectory.removeEntry?.(
          getAttachmentFileName(attachmentId),
        );
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }
      }
    }
  });
}

export function toWorkspaceStorageInfo(
  handle: WorkspaceFolderHandle | null,
  permission: WorkspaceFolderPermission | undefined,
): WorkspaceFolderStorageInfo {
  if (!handle) {
    return {
      isConnected: false,
      isSupported: isWorkspaceFolderStorageSupported(),
      kind: "browser",
    };
  }

  return {
    isConnected: permission === "granted",
    isSupported: isWorkspaceFolderStorageSupported(),
    kind: "folder",
    name: handle.name,
    permission,
  };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export type { Board };
