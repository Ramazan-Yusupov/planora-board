import type { RefObject } from "react";
import { FilePlus2, FileUp, LoaderCircle, Replace } from "lucide-react";
import { Button, Panel } from "@/modules/draw-tool/shared/ui";

type WorkspaceImportPanelProps = {
  isReading: boolean;
  newProjectInputRef: RefObject<HTMLInputElement | null>;
  replaceSceneInputRef: RefObject<HTMLInputElement | null>;
  workspaceInputRef: RefObject<HTMLInputElement | null>;
  onImportNewProject: (file: File | undefined) => void;
  onImportWorkspace: (file: File | undefined) => void;
  onReplaceScene: (file: File | undefined) => void;
};

export function WorkspaceImportPanel({
  isReading,
  newProjectInputRef,
  replaceSceneInputRef,
  workspaceInputRef,
  onImportNewProject,
  onImportWorkspace,
  onReplaceScene,
}: WorkspaceImportPanelProps) {
  return (
    <Panel className="rounded-2xl border border-border/90 bg-control/28 p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_3%)]">
      <h3 className="m-0 text-sm font-semibold text-text">Импорт</h3>
      <p className="mt-1 text-xs leading-5 text-text-muted">
        Выберите, добавить ли отдельную сцену новым проектом, заменить активную
        доску или восстановить всю рабочую область.
      </p>

      <input
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => onImportNewProject(event.currentTarget.files?.[0])}
        ref={newProjectInputRef}
        type="file"
      />
      <input
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => onReplaceScene(event.currentTarget.files?.[0])}
        ref={replaceSceneInputRef}
        type="file"
      />
      <input
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => onImportWorkspace(event.currentTarget.files?.[0])}
        ref={workspaceInputRef}
        type="file"
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button
          className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
          disabled={isReading}
          onClick={() => newProjectInputRef.current?.click()}
          type="button"
        >
          <FilePlus2 aria-hidden size={16} /> Импортировать как новый
        </Button>
        <Button
          className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
          disabled={isReading}
          onClick={() => replaceSceneInputRef.current?.click()}
          type="button"
        >
          <Replace aria-hidden size={16} /> Заменить текущую доску
        </Button>
        <Button
          className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted sm:col-span-2"
          disabled={isReading}
          onClick={() => workspaceInputRef.current?.click()}
          type="button"
        >
          {isReading ? (
            <LoaderCircle aria-hidden className="animate-spin" size={16} />
          ) : (
            <FileUp aria-hidden size={16} />
          )}{" "}
          Импортировать все проекты и настройки
        </Button>
      </div>
    </Panel>
  );
}

