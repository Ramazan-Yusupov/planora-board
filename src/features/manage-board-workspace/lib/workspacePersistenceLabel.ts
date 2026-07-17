import type { WorkspaceFolderStorageInfo } from "@/entities/board";

import type { BoardPersistenceState } from "../model/useBoardWorkspace";

type WorkspacePersistenceLabelOptions = Readonly<{
  persistenceState: BoardPersistenceState;
  workspaceStorage: WorkspaceFolderStorageInfo;
}>;

export function getWorkspacePersistenceLabel({
  persistenceState,
  workspaceStorage,
}: WorkspacePersistenceLabelOptions): string {
  if (persistenceState === "saving") {
    return "Сохраняем...";
  }

  if (persistenceState === "error") {
    return "Ошибка сохранения";
  }

  if (workspaceStorage.kind === "folder" && workspaceStorage.isConnected) {
    return `Сохранено в папку: ${workspaceStorage.name}`;
  }

  if (workspaceStorage.kind === "folder") {
    return "Требуется доступ к папке";
  }

  return "Сохранено в браузере";
}
