import type { DrawToolWorkspace } from "@/modules/draw-tool/entities/workspace";
import { projectStore } from "@/modules/draw-tool/features/projects";
import {
  activateFolderWorkspaceHandle,
  clearActiveFolderWorkspace,
  createActiveFolderBackup,
  getActiveFolderName,
  getWorkspaceFolderPermission,
  initializeFolderWorkspace,
  inspectFolderWorkspace,
  isWorkspaceFolderStorageSupported,
  pickWorkspaceFolder,
  requestWorkspaceFolderPermission,
  saveActiveFolderWorkspace,
} from "../api/workspaceFolderStorage";
import type {
  FolderWorkspaceSnapshot,
  WorkspaceFolderHandle,
  WorkspaceFolderPermission,
} from "../api/workspaceFolderStorage";
import {
  clearPersistedWorkspaceFolderHandle,
  loadPersistedWorkspaceFolderHandle,
  savePersistedWorkspaceFolderHandle,
} from "./workspaceFolderRepository";
import { createWorkspaceSnapshot } from "./createWorkspaceSnapshot";
import { parseWorkspaceSource } from "./parseWorkspaceFile";
import { restoreWorkspaceSnapshot } from "./restoreWorkspaceSnapshot";

export type WorkspacePersistenceStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error"
  | "access-needed";

export type WorkspacePersistenceState = {
  folderName: string | null;
  isBusy: boolean;
  isConnected: boolean;
  isSupported: boolean;
  lastSavedAt: string | null;
  message: string | null;
  requiresFolderResolution: boolean;
  status: WorkspacePersistenceStatus;
};

type Listener = () => void;
type ConnectFolderResult =
  | { kind: "initialized"; preservedFileName: string | null }
  | { kind: "existing"; snapshot: FolderWorkspaceSnapshot }
  | { kind: "cancelled" };

let state: WorkspacePersistenceState = {
  folderName: null,
  isBusy: false,
  isConnected: false,
  isSupported: isWorkspaceFolderStorageSupported(),
  lastSavedAt: null,
  message: null,
  requiresFolderResolution: false,
  status: "idle",
};

const listeners = new Set<Listener>();
let initialized = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<WorkspacePersistenceState>) {
  state = { ...state, ...patch };
  notify();
}

function permissionMessage(permission: WorkspaceFolderPermission) {
  return permission === "denied"
    ? "Браузер не дал доступ к backup-папке."
    : "Нужно снова разрешить доступ к backup-папке.";
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

async function attachFolder(handle: WorkspaceFolderHandle): Promise<ConnectFolderResult> {
  const permission = await requestWorkspaceFolderPermission(handle);
  if (permission !== "granted") {
    setState({
      isBusy: false,
      isConnected: false,
      folderName: handle.name,
      message: permissionMessage(permission),
      status: "access-needed",
    });
    return { kind: "cancelled" };
  }

  const inspection = await inspectFolderWorkspace(handle, parseWorkspaceSource);
  if (inspection.kind === "existing") {
    activateFolderWorkspaceHandle(handle, inspection.snapshot.workspace);
    await savePersistedWorkspaceFolderHandle(handle);
    setState({
      isBusy: false,
      isConnected: true,
      folderName: handle.name,
      lastSavedAt: inspection.snapshot.workspace.savedAt,
      message: null,
      requiresFolderResolution: true,
      status: "saved",
    });
    return { kind: "existing", snapshot: inspection.snapshot };
  }

  const workspace = await createWorkspaceSnapshot();
  const initializedFolder = await initializeFolderWorkspace(handle, workspace, {
    preserveIncompatibleContent:
      inspection.kind === "incompatible" ? inspection.content : undefined,
  });
  activateFolderWorkspaceHandle(handle, initializedFolder.workspace);
  await savePersistedWorkspaceFolderHandle(handle);
  setState({
    isBusy: false,
    isConnected: true,
    folderName: handle.name,
    lastSavedAt: initializedFolder.workspace.savedAt,
    message: null,
    requiresFolderResolution: false,
    status: "saved",
  });

  return {
    kind: "initialized",
    preservedFileName: initializedFolder.preservedFileName,
  };
}

export const workspacePersistenceStore = {
  get() {
    return state;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async initialize() {
    if (initialized) return;
    initialized = true;
    await projectStore.initialize();

    try {
      const handle = await loadPersistedWorkspaceFolderHandle();
      if (!handle) return;

      const permission = await getWorkspaceFolderPermission(handle);
      if (permission !== "granted") {
        setState({
          folderName: handle.name,
          isConnected: false,
          message: permissionMessage(permission),
          status: "access-needed",
        });
        return;
      }

      const result = await attachFolder(handle);
      if (result.kind === "existing") {
        setState({ requiresFolderResolution: false });
      }
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "Не удалось открыть backup-папку.",
        status: "error",
      });
    }
  },

  async connectFolder(): Promise<ConnectFolderResult> {
    await projectStore.initialize();
    setState({ isBusy: true, message: null });

    try {
      const handle = await pickWorkspaceFolder();
      const result = await attachFolder(handle);
      return result;
    } catch (error) {
      if (isAbortError(error)) {
        setState({ isBusy: false });
        return { kind: "cancelled" };
      }

      setState({
        isBusy: false,
        message: error instanceof Error ? error.message : "Не удалось подключить папку.",
        status: "error",
      });
      return { kind: "cancelled" };
    }
  },

  async reconnectPersistedFolder() {
    const handle = await loadPersistedWorkspaceFolderHandle();
    if (!handle) return false;
    setState({ isBusy: true, message: null });
    const result = await attachFolder(handle);
    return result.kind !== "cancelled" && Boolean(getActiveFolderName());
  },

  async saveNow() {
    if (!projectStore.get().isReady) {
      setState({ message: "Рабочая область ещё загружается." });
      return false;
    }

    if (state.isConnected && state.requiresFolderResolution) {
      setState({
        message: "Выберите: открыть backup из папки или перезаписать его текущими данными.",
      });
      return false;
    }

    try {
      setState({ isBusy: true, message: null, status: state.isConnected ? "saving" : state.status });
      const workspace = await createWorkspaceSnapshot();
      const saved = await saveActiveFolderWorkspace(workspace);
      setState({
        isBusy: false,
        lastSavedAt: saved?.savedAt ?? state.lastSavedAt,
        message: null,
        status: state.isConnected ? "saved" : "idle",
      });
      return true;
    } catch (error) {
      setState({
        isBusy: false,
        message: error instanceof Error ? error.message : "Не удалось сохранить workspace.",
        status: "error",
      });
      return false;
    }
  },

  async createBackup() {
    try {
      setState({ isBusy: true, message: null });
      await this.saveNow();
      const fileName = await createActiveFolderBackup();
      setState({
        isBusy: false,
        message: fileName ? `Создан ${fileName}` : "Подключите папку для backup.",
        status: state.isConnected ? "saved" : "idle",
      });
      return fileName;
    } catch (error) {
      setState({
        isBusy: false,
        message: error instanceof Error ? error.message : "Не удалось создать backup.",
        status: "error",
      });
      return null;
    }
  },

  async restoreWorkspace(workspace: DrawToolWorkspace) {
    setState({ isBusy: true, message: null });
    try {
      await restoreWorkspaceSnapshot(workspace);
      setState({ requiresFolderResolution: false });
      await this.saveNow();
      setState({ isBusy: false, message: null, status: state.isConnected ? "saved" : "idle" });
      return true;
    } catch (error) {
      setState({
        isBusy: false,
        message: error instanceof Error ? error.message : "Не удалось восстановить workspace.",
        status: "error",
      });
      return false;
    }
  },

  async overwriteConnectedFolder() {
    setState({ requiresFolderResolution: false });
    return this.saveNow();
  },

  async disconnectFolder() {
    clearActiveFolderWorkspace();
    await clearPersistedWorkspaceFolderHandle();
    setState({
      folderName: null,
      isConnected: false,
      isBusy: false,
      lastSavedAt: null,
      message: null,
      requiresFolderResolution: false,
      status: "idle",
    });
  },
};

