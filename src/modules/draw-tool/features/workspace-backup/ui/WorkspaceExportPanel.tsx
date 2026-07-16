import { Download, ImageDown } from "lucide-react";
import { Button, Panel } from "@/modules/draw-tool/shared/ui";

type WorkspaceExportPanelProps = {
  projectCount: number;
  onDownloadGraphic: (format: "png" | "svg") => void;
  onDownloadScene: () => void;
  onDownloadWorkspace: () => void;
};

export function WorkspaceExportPanel({
  projectCount,
  onDownloadGraphic,
  onDownloadScene,
  onDownloadWorkspace,
}: WorkspaceExportPanelProps) {
  return (
    <Panel className="rounded-2xl border border-border/90 bg-control/28 p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_3%)]">
      <h3 className="m-0 text-sm font-semibold text-text">Экспорт</h3>
      <p className="mt-1 text-xs leading-5 text-text-muted">
        Сцена — это только текущая доска. Полный backup включает все{" "}
        {projectCount} проектов, viewport и настройки инструментов.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button
          className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
          onClick={onDownloadScene}
          type="button"
        >
          <Download aria-hidden size={16} /> Текущий проект JSON
        </Button>
        <Button
          className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
          onClick={onDownloadWorkspace}
          type="button"
        >
          <Download aria-hidden size={16} /> Все проекты и настройки
        </Button>
        <Button
          className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
          onClick={() => onDownloadGraphic("png")}
          type="button"
        >
          <ImageDown aria-hidden size={16} /> Скачать PNG
        </Button>
        <Button
          className="flex items-center justify-center gap-2 rounded-xl bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
          onClick={() => onDownloadGraphic("svg")}
          type="button"
        >
          <ImageDown aria-hidden size={16} /> Скачать SVG
        </Button>
      </div>
    </Panel>
  );
}

