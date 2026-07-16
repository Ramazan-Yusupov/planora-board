import {
  DRAWTOOL_WORKSPACE_FORMAT,
  DRAWTOOL_WORKSPACE_VERSION,
} from "@/modules/draw-tool/entities/workspace";
import type { DrawToolWorkspace } from "@/modules/draw-tool/entities/workspace";
import { createId } from "@/modules/draw-tool/shared/lib";

export const DRAWTOOL_WORKSPACE_FILE_NAME = "drawtool-workspace.json";
export const DRAWTOOL_BACKUPS_DIRECTORY_NAME = "backups";
const LAST_SAVED_BACKUP_FILE_NAME = "last-saved.json";

export type WorkspaceFolderPermission =
  | "granted"
  | "prompt"
  | "denied"
  | "unsupported";

type FileSystemPermissionDescriptor = { mode?: "read" | "readwrite" };
type WorkspaceFolderWritable = {
  write: (data: Blob | string) => Promise<void>;
  close: () => Promise<void>;
};
type WorkspaceFolderFileHandle = {
  getFile: () => Promise<File>;
  createWritable: () => Promise<WorkspaceFolderWritable>;
};

export type WorkspaceFolderHandle = {
  kind: "directory";
  name: string;
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<WorkspaceFolderHandle>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<WorkspaceFolderFileHandle>;
  queryPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
  requestPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: { id?: string; mode?: "read" | "readwrite" }) => Promise<WorkspaceFolderHandle>;
};

export type FolderWorkspaceSnapshot = {
  folderName: string;
  workspace: DrawToolWorkspace;
};

/**
 * Result of inspecting the selected folder. A folder is usable even when it
 * has never been prepared by DrawTool before.
 */
export type FolderWorkspaceInspection =
  | { kind: "empty"; folderName: string }
  | { kind: "existing"; snapshot: FolderWorkspaceSnapshot }
  | {
      kind: "incompatible";
      folderName: string;
      content: string;
      reason: string;
    };

type ActiveFolderSession = {
  handle: WorkspaceFolderHandle;
  workspaceId: string;
  revision: number;
};

let activeFolderSession: ActiveFolderSession | null = null;
let folderWriteQueue: Promise<void> = Promise.resolve();

function queueFolderWrite(task: () => Promise<void>) {
  const queued = folderWriteQueue.then(task, task);
  folderWriteQueue = queued.catch(() => undefined);
  return queued;
}

function isNotFoundError(error: unknown) {
  return error instanceof DOMException && error.name === "NotFoundError";
}

async function writeTextFile(
  directoryHandle: WorkspaceFolderHandle,
  fileName: string,
  content: string,
) {
  const handle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await handle.createWritable();

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
    const handle = await directoryHandle.getFileHandle(fileName);
    return (await handle.getFile()).text();
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

function normalizeWorkspace(raw: DrawToolWorkspace): DrawToolWorkspace {
  return {
    ...raw,
    format: DRAWTOOL_WORKSPACE_FORMAT,
    version: DRAWTOOL_WORKSPACE_VERSION,
    workspaceId: raw.workspaceId || createId("workspace"),
    revision: Math.max(0, Number.isInteger(raw.revision) ? raw.revision : 0),
    savedAt: raw.savedAt || new Date().toISOString(),
  };
}

function createPayload(
  workspace: DrawToolWorkspace,
  session: Pick<ActiveFolderSession, "workspaceId" | "revision">,
): DrawToolWorkspace {
  return {
    ...normalizeWorkspace(workspace),
    workspaceId: session.workspaceId,
    revision: session.revision,
    savedAt: new Date().toISOString(),
  };
}

async function copyLastSavedBackup(handle: WorkspaceFolderHandle) {
  const existing = await readTextFile(handle, DRAWTOOL_WORKSPACE_FILE_NAME);
  if (!existing) return;

  const backups = await handle.getDirectoryHandle(DRAWTOOL_BACKUPS_DIRECTORY_NAME, {
    create: true,
  });
  await writeTextFile(backups, LAST_SAVED_BACKUP_FILE_NAME, existing);
}

function createBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `backup-${timestamp}.json`;
}

export function isWorkspaceFolderStorageSupported() {
  return typeof window !== "undefined" && typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function";
}

export async function pickWorkspaceFolder() {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) {
    throw new Error("Выбор папки поддерживается в Chrome и Edge на компьютере. Используйте экспорт JSON в этом браузере.");
  }

  return picker({ id: "drawtool-workspace", mode: "readwrite" });
}

export async function getWorkspaceFolderPermission(handle: WorkspaceFolderHandle): Promise<WorkspaceFolderPermission> {
  if (!handle.queryPermission) return "prompt";
  return handle.queryPermission({ mode: "readwrite" });
}

export async function requestWorkspaceFolderPermission(handle: WorkspaceFolderHandle): Promise<WorkspaceFolderPermission> {
  if (!handle.requestPermission) return "prompt";
  return handle.requestPermission({ mode: "readwrite" });
}

export async function inspectFolderWorkspace(
  handle: WorkspaceFolderHandle,
  parseWorkspace: (source: string) => DrawToolWorkspace,
): Promise<FolderWorkspaceInspection> {
  const content = await readTextFile(handle, DRAWTOOL_WORKSPACE_FILE_NAME);
  if (!content) {
    return { kind: "empty", folderName: handle.name };
  }

  try {
    return {
      kind: "existing",
      snapshot: {
        folderName: handle.name,
        workspace: parseWorkspace(content),
      },
    };
  } catch (error) {
    return {
      kind: "incompatible",
      folderName: handle.name,
      content,
      reason: error instanceof Error ? error.message : "Неизвестный формат файла.",
    };
  }
}

function createIncompatibleBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `incompatible-workspace-${timestamp}.json`;
}

export async function initializeFolderWorkspace(
  handle: WorkspaceFolderHandle,
  workspace: DrawToolWorkspace,
  options: { preserveIncompatibleContent?: string } = {},
) {
  const payload = {
    ...normalizeWorkspace(workspace),
    workspaceId: workspace.workspaceId || createId("workspace"),
    revision: Math.max(1, workspace.revision || 1),
    savedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(payload, null, 2);
  const backups = await handle.getDirectoryHandle(DRAWTOOL_BACKUPS_DIRECTORY_NAME, {
    create: true,
  });

  let preservedFileName: string | null = null;
  if (options.preserveIncompatibleContent) {
    preservedFileName = createIncompatibleBackupFileName();
    await writeTextFile(backups, preservedFileName, options.preserveIncompatibleContent);
  }

  await writeTextFile(handle, DRAWTOOL_WORKSPACE_FILE_NAME, serialized);
  await writeTextFile(backups, LAST_SAVED_BACKUP_FILE_NAME, serialized);

  return {
    folderName: handle.name,
    workspace: payload,
    preservedFileName,
  };
}

export function activateFolderWorkspaceHandle(
  handle: WorkspaceFolderHandle,
  workspace: DrawToolWorkspace,
) {
  activeFolderSession = {
    handle,
    workspaceId: workspace.workspaceId,
    revision: workspace.revision,
  };
}

export function clearActiveFolderWorkspace() {
  activeFolderSession = null;
}

export function getActiveFolderWorkspaceHandle() {
  return activeFolderSession?.handle ?? null;
}

export function getActiveFolderName() {
  return activeFolderSession?.handle.name ?? null;
}

export async function saveActiveFolderWorkspace(workspace: DrawToolWorkspace): Promise<DrawToolWorkspace | null> {
  if (!activeFolderSession) return null;

  let saved: DrawToolWorkspace | null = null;
  await queueFolderWrite(async () => {
    const session = activeFolderSession;
    if (!session) return;

    await copyLastSavedBackup(session.handle);
    const payload = createPayload(workspace, {
      workspaceId: session.workspaceId,
      revision: session.revision + 1,
    });
    await writeTextFile(session.handle, DRAWTOOL_WORKSPACE_FILE_NAME, JSON.stringify(payload, null, 2));
    activeFolderSession = { ...session, revision: payload.revision };
    saved = payload;
  });

  return saved as DrawToolWorkspace | null;
}

export async function createActiveFolderBackup() {
  const session = activeFolderSession;
  if (!session) return null;

  let fileName: string | null = null;
  await queueFolderWrite(async () => {
    const content = await readTextFile(session.handle, DRAWTOOL_WORKSPACE_FILE_NAME);
    if (!content) return;

    const backups = await session.handle.getDirectoryHandle(DRAWTOOL_BACKUPS_DIRECTORY_NAME, { create: true });
    fileName = createBackupFileName();
    await writeTextFile(backups, fileName, content);
  });

  return fileName;
}

