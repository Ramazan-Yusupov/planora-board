import { Download, FolderOpen, LoaderCircle, Unplug } from "lucide-react";
import type { workspacePersistenceStore } from "../model/workspacePersistenceStore";
import { Button, Panel } from "@/modules/draw-tool/shared/ui";

type WorkspaceStorageState = ReturnType<typeof workspacePersistenceStore.get>;

type WorkspaceBackupFolderPanelProps = {
  storage: WorkspaceStorageState;
  onConnectFolder: () => void;
  onCreateBackup: () => void;
  onDisconnectFolder: () => void;
  onReconnectFolder: () => void;
};

function formatSavedAt(value: string | null) {
  if (!value) return "ещё не сохранялось";
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function WorkspaceBackupFolderPanel({
  storage,
  onConnectFolder,
  onCreateBackup,
  onDisconnectFolder,
  onReconnectFolder,
}: WorkspaceBackupFolderPanelProps) {
  return (
    <Panel className="rounded-2xl border border-border/90 bg-control/28 p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_3%)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-sm font-semibold text-text">
            Backup-папка
          </h3>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            {storage.isConnected
              ? `Подключена: ${storage.folderName}. Последнее сохранение: ${formatSavedAt(storage.lastSavedAt)}.`
              : "Создайте пустую папку, например DrawTool, и выберите её: приложение само создаст workspace-файл и папку backups."}
          </p>
        </div>
        {storage.isConnected ? (
          <span className="shrink-0 rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-medium text-emerald-300">
            Подключена
          </span>
        ) : null}
      </div>

      {!storage.isSupported ? (
        <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/10 px-2.5 py-2 text-xs leading-5 text-amber-200">
          Выбор папки доступен в Chrome и Edge на компьютере. В этом браузере
          используйте экспорт JSON.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
            disabled={storage.isBusy}
            onClick={onConnectFolder}
            type="button"
          >
            {storage.isBusy ? (
              <LoaderCircle aria-hidden className="animate-spin" size={16} />
            ) : (
              <FolderOpen aria-hidden size={16} />
            )}
            {storage.isConnected ? "Сменить папку" : "Выбрать папку"}
          </Button>

          {storage.status === "access-needed" ? (
            <Button
              className="rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
              disabled={storage.isBusy}
              onClick={onReconnectFolder}
              type="button"
            >
              Разрешить доступ
            </Button>
          ) : null}

          {storage.isConnected ? (
            <Button
              className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
              disabled={storage.isBusy}
              onClick={onCreateBackup}
              type="button"
            >
              <Download aria-hidden size={16} />
              Создать backup
            </Button>
          ) : null}

          {storage.isConnected ? (
            <Button
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-text-muted hover:bg-red-500/10 hover:text-red-300"
              disabled={storage.isBusy}
              onClick={onDisconnectFolder}
              type="button"
            >
              <Unplug aria-hidden size={16} />
              Отключить
            </Button>
          ) : null}
        </div>
      )}

      {storage.message ? (
        <p className="mt-3 text-xs text-red-300">{storage.message}</p>
      ) : null}
    </Panel>
  );
}

