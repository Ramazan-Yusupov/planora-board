import { useRef, useState, useSyncExternalStore } from "react";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import {
  exportToPng,
  exportToSvg,
  downloadFile,
} from "@/modules/draw-tool/features/export-scene";
import { importScene, parseSceneFile } from "@/modules/draw-tool/features/import-scene";
import { projectStore } from "@/modules/draw-tool/features/projects";
import {
  downloadSceneFile,
  restoreSceneFromFile,
} from "@/modules/draw-tool/features/save-scene/model/saveSceneFile";
import { ConfirmDialog, Modal } from "@/modules/draw-tool/shared/ui";
import type { DrawToolWorkspace } from "@/modules/draw-tool/entities/workspace";
import { parseWorkspaceFile } from "../model/parseWorkspaceFile";
import { workspacePersistenceStore } from "../model/workspacePersistenceStore";
import { downloadWorkspaceExport } from "../model/workspaceTransfer";
import { WorkspaceBackupFolderPanel } from "./WorkspaceBackupFolderPanel";
import { WorkspaceExportPanel } from "./WorkspaceExportPanel";
import { WorkspaceFolderConflictModal } from "./WorkspaceFolderConflictModal";
import { WorkspaceImportPanel } from "./WorkspaceImportPanel";

type WorkspaceDataModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function WorkspaceDataModal({
  isOpen,
  onClose,
}: WorkspaceDataModalProps) {
  const newProjectInputRef = useRef<HTMLInputElement | null>(null);
  const replaceSceneInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceInputRef = useRef<HTMLInputElement | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingWorkspace, setPendingWorkspace] =
    useState<DrawToolWorkspace | null>(null);
  const [folderWorkspace, setFolderWorkspace] =
    useState<DrawToolWorkspace | null>(null);
  const [isReading, setIsReading] = useState(false);

  const storage = useSyncExternalStore(
    workspacePersistenceStore.subscribe,
    workspacePersistenceStore.get,
    workspacePersistenceStore.get,
  );
  const projects = useSyncExternalStore(
    projectStore.subscribe,
    projectStore.get,
    projectStore.get,
  );

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  }

  async function runAction(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Не удалось выполнить действие.",
      );
    }
  }

  async function handleConnectFolder() {
    const result = await workspacePersistenceStore.connectFolder();
    if (result.kind === "existing") {
      setFolderWorkspace(result.snapshot.workspace);
      return;
    }
    if (result.kind === "initialized") {
      showNotice(
        result.preservedFileName
          ? `Папка подготовлена. Старый файл сохранён в backups/${result.preservedFileName}.`
          : "Папка подготовлена. Рабочая область и backups созданы.",
      );
    }
  }

  async function handleNewProjectImport(file: File | undefined) {
    if (!file) return;
    setIsReading(true);
    try {
      await restoreSceneFromFile(file);
      await workspacePersistenceStore.saveNow();
      showNotice("Проект импортирован.");
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Не удалось импортировать проект.",
      );
    } finally {
      setIsReading(false);
      if (newProjectInputRef.current) newProjectInputRef.current.value = "";
    }
  }

  async function handleReplaceScene(file: File | undefined) {
    if (!file) return;
    setIsReading(true);
    try {
      importScene(await parseSceneFile(file));
      await workspacePersistenceStore.saveNow();
      showNotice("Текущая доска заменена.");
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Не удалось импортировать доску.",
      );
    } finally {
      setIsReading(false);
      if (replaceSceneInputRef.current) replaceSceneInputRef.current.value = "";
    }
  }

  async function handleWorkspaceImport(file: File | undefined) {
    if (!file) return;
    setIsReading(true);
    try {
      setPendingWorkspace(await parseWorkspaceFile(file));
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : "Не удалось прочитать резервную копию.",
      );
    } finally {
      setIsReading(false);
      if (workspaceInputRef.current) workspaceInputRef.current.value = "";
    }
  }

  async function downloadGraphic(format: "png" | "svg") {
    const elements = sceneStore.get().elements;
    const file =
      format === "png" ? await exportToPng(elements) : exportToSvg(elements);
    downloadFile(file.blob, file.fileName);
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Хранилище и резервные копии"
      >
        <div className="space-y-4">
          <WorkspaceBackupFolderPanel
            onConnectFolder={() => void handleConnectFolder()}
            onCreateBackup={() =>
              void runAction(async () => {
                await workspacePersistenceStore.createBackup();
              })
            }
            onDisconnectFolder={() =>
              void workspacePersistenceStore.disconnectFolder()
            }
            onReconnectFolder={() =>
              void workspacePersistenceStore.reconnectPersistedFolder()
            }
            storage={storage}
          />

          <WorkspaceExportPanel
            onDownloadGraphic={(format) => void downloadGraphic(format)}
            onDownloadScene={downloadSceneFile}
            onDownloadWorkspace={() => void downloadWorkspaceExport()}
            projectCount={projects.projects.length}
          />

          <WorkspaceImportPanel
            isReading={isReading}
            newProjectInputRef={newProjectInputRef}
            onImportNewProject={(file) => void handleNewProjectImport(file)}
            onImportWorkspace={(file) => void handleWorkspaceImport(file)}
            onReplaceScene={(file) => void handleReplaceScene(file)}
            replaceSceneInputRef={replaceSceneInputRef}
            workspaceInputRef={workspaceInputRef}
          />

          {notice ? (
            <p className="m-0 rounded-lg border border-border bg-panel px-3 py-2 text-xs text-text">
              {notice}
            </p>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel="Заменить проекты"
        description={
          pendingWorkspace
            ? `Будут заменены все текущие проекты и настройки. В резервной копии: ${pendingWorkspace.projects.length} проект(а).`
            : ""
        }
        isOpen={pendingWorkspace !== null}
        onCancel={() => setPendingWorkspace(null)}
        onConfirm={() => {
          const workspace = pendingWorkspace;
          setPendingWorkspace(null);
          if (workspace)
            void runAction(async () => {
              await workspacePersistenceStore.restoreWorkspace(workspace);
            });
        }}
        title="Импортировать резервную копию?"
      />

      <WorkspaceFolderConflictModal
        onClose={() => setFolderWorkspace(null)}
        onOpenWorkspace={(workspace) => {
          setFolderWorkspace(null);
          void runAction(async () => {
            await workspacePersistenceStore.restoreWorkspace(workspace);
          });
        }}
        onOverwriteFolder={() => {
          setFolderWorkspace(null);
          void runAction(async () => {
            await workspacePersistenceStore.overwriteConnectedFolder();
          });
        }}
        workspace={folderWorkspace}
      />
    </>
  );
}

