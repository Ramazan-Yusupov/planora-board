import {
  Cloud,
  CloudCheck,
  CloudOff,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { IconButton, Tooltip } from "@/modules/draw-tool/shared/ui";
import { workspacePersistenceStore } from "../model/workspacePersistenceStore";

type WorkspaceBackupStatusProps = {
  onOpen: () => void;
};

function getLabel(status: ReturnType<typeof workspacePersistenceStore.get>) {
  if (status.status === "saving") return "Backup: сохранение…";
  if (status.status === "saved" && status.isConnected)
    return `Backup подключён: ${status.folderName ?? "папка"}`;
  if (status.status === "access-needed")
    return "Backup: нужно разрешить доступ к папке";
  if (status.status === "error")
    return `Backup: ${status.message ?? "ошибка сохранения"}`;
  return "Backup-папка не подключена";
}

export function WorkspaceBackupStatus({ onOpen }: WorkspaceBackupStatusProps) {
  const status = useSyncExternalStore(
    workspacePersistenceStore.subscribe,
    workspacePersistenceStore.get,
    workspacePersistenceStore.get,
  );

  const Icon =
    status.status === "saving"
      ? LoaderCircle
      : status.status === "saved" && status.isConnected
        ? CloudCheck
        : status.status === "access-needed"
          ? TriangleAlert
          : status.status === "error"
            ? CloudOff
            : Cloud;

  const className =
    status.status === "saved" && status.isConnected
      ? "text-emerald-400"
      : status.status === "access-needed"
        ? "text-amber-300"
        : status.status === "error"
          ? "text-red-400"
          : "text-text-muted";

  return (
    <Tooltip content={getLabel(status)} side="bottom">
      <IconButton
        aria-label="Открыть хранилище и резервные копии"
        className="grid size-9 place-items-center rounded-lg text-text transition-colors hover:bg-control"
        onClick={onOpen}
        title={getLabel(status)}
        type="button"
      >
        <Icon
          aria-hidden
          className={
            status.status === "saving" ? `${className} animate-spin` : className
          }
          size={18}
        />
      </IconButton>
    </Tooltip>
  );
}

