import {
  deleteWorkspaceMetaRecord,
  getWorkspaceMetaRecord,
  putWorkspaceMetaRecord,
} from "@/modules/draw-tool/shared/lib/storage/indexedDb";
import type { WorkspaceFolderHandle } from "../api/workspaceFolderStorage";

const ACTIVE_WORKSPACE_FOLDER_KEY = "active-workspace-folder";

type FolderHandleRecord = {
  key: typeof ACTIVE_WORKSPACE_FOLDER_KEY;
  handle: WorkspaceFolderHandle;
};

export async function loadPersistedWorkspaceFolderHandle() {
  const record = await getWorkspaceMetaRecord<FolderHandleRecord>(ACTIVE_WORKSPACE_FOLDER_KEY);
  return record?.handle ?? null;
}

export function savePersistedWorkspaceFolderHandle(handle: WorkspaceFolderHandle) {
  return putWorkspaceMetaRecord<FolderHandleRecord>({
    key: ACTIVE_WORKSPACE_FOLDER_KEY,
    handle,
  });
}

export function clearPersistedWorkspaceFolderHandle() {
  return deleteWorkspaceMetaRecord(ACTIVE_WORKSPACE_FOLDER_KEY);
}

