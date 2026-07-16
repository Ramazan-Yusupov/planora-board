import type { DrawToolWorkspace } from "@/modules/draw-tool/entities/workspace";
import { Button, Modal } from "@/modules/draw-tool/shared/ui";

type WorkspaceFolderConflictModalProps = {
  workspace: DrawToolWorkspace | null;
  onClose: () => void;
  onOpenWorkspace: (workspace: DrawToolWorkspace) => void;
  onOverwriteFolder: () => void;
};

export function WorkspaceFolderConflictModal({
  workspace,
  onClose,
  onOpenWorkspace,
  onOverwriteFolder,
}: WorkspaceFolderConflictModalProps) {
  return (
    <Modal
      isOpen={workspace !== null}
      onClose={onClose}
      title="В папке найдена рабочая область"
    >
      <p className="m-0 text-sm leading-6 text-text-muted">
        В папке есть backup с {workspace?.projects.length ?? 0} проектами.
        Открыть его или перезаписать папку текущими данными DrawTool?
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:brightness-110"
          onClick={() => {
            if (workspace) {
              onOpenWorkspace(workspace);
            }
          }}
          type="button"
        >
          Открыть данные из папки
        </Button>
        <Button
          className="rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
          onClick={onOverwriteFolder}
          type="button"
        >
          Перезаписать папку
        </Button>
      </div>
    </Modal>
  );
}

