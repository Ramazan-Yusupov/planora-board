"use client";

import {
  Download,
  FileUp,
  FolderOpen,
  HardDrive,
  LoaderCircle,
  Unplug,
} from "lucide-react";
import { useRef, useState } from "react";

import type {
  Board,
  BoardWorkspace,
  WorkspaceFolderStorageInfo,
} from "@/entities/board";
import {
  downloadWorkspaceExport,
  parseWorkspaceImport,
  type WorkspaceImportResult,
} from "@/features/import-export";
import { Button, ConfirmDialog, Modal, Panel } from "@/shared/ui";

type WorkspaceDataModalProps = Readonly<{
  activeBoard: Board;
  isOpen: boolean;
  isWorkspaceStorageBusy: boolean;
  onClose: () => void;
  onConnectFolder: () => Promise<void>;
  onCreateFolderBackup: () => Promise<void>;
  onDisconnectFolder: () => Promise<void>;
  onImport: (result: WorkspaceImportResult) => void;
  workspace: BoardWorkspace;
  workspaceStorage: WorkspaceFolderStorageInfo;
}>;

function FolderStoragePanel({
  isBusy,
  onConnectFolder,
  onCreateFolderBackup,
  onDisconnectFolder,
  storage,
}: Readonly<{
  isBusy: boolean;
  onConnectFolder: () => Promise<void>;
  onCreateFolderBackup: () => Promise<void>;
  onDisconnectFolder: () => Promise<void>;
  storage: WorkspaceFolderStorageInfo;
}>) {
  const isFolderConnected = storage.kind === "folder" && storage.isConnected;
  const needsFolderAccess = storage.kind === "folder" && !storage.isConnected;

  const runAction = (action: () => Promise<void>) => {
    void action();
  };

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-control text-accent">
            <HardDrive aria-hidden="true" size={19} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text">Хранилище</h3>
            {isFolderConnected ? (
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Данные и вложения сохраняются в папку <strong className="font-medium text-text">{storage.name}</strong>. Очистка данных сайта не удалит проекты.
              </p>
            ) : needsFolderAccess ? (
              <p className="mt-1 text-xs leading-5 text-amber-200">
                Папка «{storage.name}» требует повторного разрешения. Выберите её снова, чтобы продолжить сохранение на диск.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Сейчас проекты хранятся в браузере. Подключите папку, чтобы переносить среду между компьютерами и не зависеть от очистки кэша.
              </p>
            )}
          </div>
        </div>

        {isFolderConnected ? (
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
            Папка подключена
          </span>
        ) : null}
      </div>

      {!storage.isSupported ? (
        <p className="mt-3 rounded-xl border border-amber-300/25 bg-amber-950/30 px-3 py-2 text-xs leading-5 text-amber-100">
          Выбор папки доступен в Chrome и Edge на компьютере. Для этого браузера используйте экспорт JSON.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            disabled={isBusy}
            className="sm:flex-1"
            variant="secondary"
            onClick={() => runAction(onConnectFolder)}
          >
            {isBusy ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
            ) : (
              <FolderOpen aria-hidden="true" size={17} />
            )}
            {isFolderConnected ? "Сменить папку" : "Выбрать папку"}
          </Button>

          {isFolderConnected ? (
            <Button
              disabled={isBusy}
              className="sm:flex-1"
              variant="secondary"
              onClick={() => runAction(onCreateFolderBackup)}
            >
              <Download aria-hidden="true" size={17} />
              Создать backup
            </Button>
          ) : null}

          {isFolderConnected ? (
            <Button
              disabled={isBusy}
              className="sm:flex-1"
              variant="ghost"
              onClick={() => runAction(onDisconnectFolder)}
            >
              <Unplug aria-hidden="true" size={17} />
              Отключить
            </Button>
          ) : null}
        </div>
      )}
    </Panel>
  );
}

export function WorkspaceDataModal({
  activeBoard,
  isOpen,
  isWorkspaceStorageBusy,
  onClose,
  onConnectFolder,
  onCreateFolderBackup,
  onDisconnectFolder,
  onImport,
  workspace,
  workspaceStorage,
}: WorkspaceDataModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingWorkspace, setPendingWorkspace] =
    useState<WorkspaceImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const chooseFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setIsReading(true);
    setError(null);

    try {
      setPendingWorkspace(await parseWorkspaceImport(file));
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Не удалось импортировать файл.",
      );
    } finally {
      setIsReading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <Modal title="Хранилище и резервные копии" onClose={onClose}>
        <div className="space-y-4">
          <FolderStoragePanel
            isBusy={isWorkspaceStorageBusy}
            storage={workspaceStorage}
            onConnectFolder={onConnectFolder}
            onCreateFolderBackup={onCreateFolderBackup}
            onDisconnectFolder={onDisconnectFolder}
          />

          <Panel>
            <h3 className="text-sm font-semibold text-text">Экспорт</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Скачайте JSON-файл проекта или всей рабочей области. Файлы-вложения не входят в JSON-резервную копию.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                className="sm:flex-1"
                variant="secondary"
                onClick={() =>
                  downloadWorkspaceExport(workspace, "board", activeBoard.id)
                }
              >
                <Download aria-hidden="true" size={17} />
                Этот проект
              </Button>
              <Button
                className="sm:flex-1"
                variant="secondary"
                onClick={() => downloadWorkspaceExport(workspace, "workspace")}
              >
                <Download aria-hidden="true" size={17} />
                Все проекты
              </Button>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-sm font-semibold text-text">Импорт JSON</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Импорт заменяет текущие проекты. Подключённая папка получит обновлённую рабочую область после подтверждения импорта.
            </p>
            <input
              ref={inputRef}
              accept="application/json,.json"
              className="sr-only"
              type="file"
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
            <Button
              className="mt-3"
              disabled={isReading}
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              {isReading ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
              ) : (
                <FileUp aria-hidden="true" size={17} />
              )}
              Выбрать JSON
            </Button>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          </Panel>
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel="Заменить проекты"
        description={
          pendingWorkspace
            ? `Будут заменены все текущие проекты. В файле: ${pendingWorkspace.workspace.boards.length} проект(а).`
            : ""
        }
        destructive
        isOpen={pendingWorkspace !== null}
        title="Импортировать резервную копию?"
        onCancel={() => setPendingWorkspace(null)}
        onConfirm={() => {
          if (pendingWorkspace) {
            onImport(pendingWorkspace);
          }
          setPendingWorkspace(null);
          onClose();
        }}
      />
    </>
  );
}
