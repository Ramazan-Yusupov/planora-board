"use client";

import { Download, FileUp, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

import type { Board, BoardWorkspace } from "@/entities/board";
import { downloadWorkspaceExport, parseWorkspaceImport } from "@/features/import-export";
import { Button, ConfirmDialog, Modal, Panel } from "@/shared/ui";

type WorkspaceDataModalProps = Readonly<{
  activeBoard: Board;
  isOpen: boolean;
  onClose: () => void;
  onImport: (workspace: BoardWorkspace) => void;
  workspace: BoardWorkspace;
}>;

export function WorkspaceDataModal({
  activeBoard,
  isOpen,
  onClose,
  onImport,
  workspace,
}: WorkspaceDataModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingWorkspace, setPendingWorkspace] = useState<BoardWorkspace | null>(null);
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
        importError instanceof Error ? importError.message : "Не удалось импортировать файл.",
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
      <Modal title="Резервная копия" onClose={onClose}>
        <div className="space-y-4">
          <Panel>
            <h3 className="text-sm font-semibold text-text">Экспорт</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Скачайте JSON-файл проекта или всей рабочей области. Файлы-вложения не входят в JSON-резервную копию.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button className="sm:flex-1" variant="secondary" onClick={() => downloadWorkspaceExport(workspace, "board", activeBoard.id)}>
                <Download aria-hidden="true" size={17} />
                Этот проект
              </Button>
              <Button className="sm:flex-1" variant="secondary" onClick={() => downloadWorkspaceExport(workspace, "workspace")}>
                <Download aria-hidden="true" size={17} />
                Все проекты
              </Button>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-sm font-semibold text-text">Импорт</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Импорт заменяет все локальные проекты. Сначала экспортируйте текущую рабочую область, если она нужна как резервная копия.
            </p>
            <input
              ref={inputRef}
              accept="application/json,.json"
              className="sr-only"
              type="file"
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
            <Button className="mt-3" disabled={isReading} variant="secondary" onClick={() => inputRef.current?.click()}>
              {isReading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <FileUp aria-hidden="true" size={17} />}
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
            ? `Будут заменены все локальные проекты. В файле: ${pendingWorkspace.boards.length} проект(а).`
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
