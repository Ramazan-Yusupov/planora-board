import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowRightLeft,
  Braces,
  Cable,
  Download,
  FileCode2,
  FileText,
  Grid3X3,
  History,
  Import,
  ListTree,
  MonitorPlay,
  Search,
  Sparkles,
} from "lucide-react";
import { boardActions } from "@/modules/draw-tool/features/board-actions";
import { Button, Modal } from "@/modules/draw-tool/shared/ui";
import { framePresentationStore } from "../model/framePresentationStore";
import { productivityToolsStore } from "../model/productivityToolsStore";

function formatTime(value: number) {
  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(value);
}

export function ProductivityToolsDialog() {
  const isOpen = useSyncExternalStore(
    productivityToolsStore.subscribe,
    productivityToolsStore.get,
    productivityToolsStore.get,
  );
  const [diagramSource, setDiagramSource] = useState(
    "flowchart LR\nIdea --> Draft\nDraft --> Review\nReview --> Done",
  );
  const [csvSource, setCsvSource] = useState(
    "Name,Status,Owner\nAPI,Draft,Ramazan\nCanvas,Done,Team",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const searchResults = useMemo(
    () => boardActions.searchElements(searchQuery),
    [searchQuery],
  );
  const snapshots = isOpen ? boardActions.getSnapshots() : [];
  const frames = isOpen ? boardActions.getFrames() : [];

  function run(action: () => boolean | Promise<boolean>, message: string) {
    void Promise.resolve(action())
      .then((ok) => setStatus(ok ? message : "Нечего применить для текущего выбора."))
      .catch((error: unknown) =>
        setStatus(error instanceof Error ? error.message : "Не удалось выполнить действие."),
      );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={productivityToolsStore.close}
      title="Power tools"
    >
      <div className="space-y-5">
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Braces size={16} />
            Diagram-as-code / Mermaid import
          </div>
          <textarea
            className="min-h-28 w-full resize-y rounded-lg border border-border bg-control px-3 py-2 font-mono text-xs text-text outline-none focus:border-accent"
            onChange={(event) => setDiagramSource(event.currentTarget.value)}
            spellCheck={false}
            value={diagramSource}
          />
          <Button
            className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-slate-950"
            onClick={() =>
              run(
                () => boardActions.insertDiagramFromCode(diagramSource),
                "Диаграмма создана из текста.",
              )
            }
            type="button"
          >
            <FileCode2 size={16} />
            Создать диаграмму
          </Button>
        </section>

        <section className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <Button
            className="flex min-h-12 items-center gap-2 rounded-lg bg-control px-3 text-left text-sm text-text hover:bg-surface-muted"
            onClick={() => run(boardActions.connectSelectionSmart, "Выбранные элементы соединены.")}
            type="button"
          >
            <Cable size={17} />
            Smart connector 2.0
          </Button>
          <Button
            className="flex min-h-12 items-center gap-2 rounded-lg bg-control px-3 text-left text-sm text-text hover:bg-surface-muted"
            onClick={() => run(boardActions.insertBezierConnector, "Bezier connector добавлен.")}
            type="button"
          >
            <ArrowRightLeft size={17} />
            Polyline / Bezier
          </Button>
          <Button
            className="flex min-h-12 items-center gap-2 rounded-lg bg-control px-3 text-left text-sm text-text hover:bg-surface-muted"
            onClick={() => run(boardActions.insertMarkdownNote, "Markdown заметка добавлена.")}
            type="button"
          >
            <FileText size={17} />
            Markdown note
          </Button>
          <Button
            className="flex min-h-12 items-center gap-2 rounded-lg bg-control px-3 text-left text-sm text-text hover:bg-surface-muted"
            onClick={() => run(() => boardActions.autoLayoutSelection("flow"), "Выделение разложено в flow.")}
            type="button"
          >
            <ListTree size={17} />
            Auto layout flow
          </Button>
          <Button
            className="flex min-h-12 items-center gap-2 rounded-lg bg-control px-3 text-left text-sm text-text hover:bg-surface-muted"
            onClick={() => run(() => boardActions.autoLayoutSelection("grid"), "Выделение разложено в grid.")}
            type="button"
          >
            <Grid3X3 size={17} />
            Tidy grid
          </Button>
          <Button
            className="flex min-h-12 items-center gap-2 rounded-lg bg-control px-3 text-left text-sm text-text hover:bg-surface-muted"
            onClick={() => run(() => boardActions.createSnapshot("Power checkpoint"), "Snapshot создан.")}
            type="button"
          >
            <History size={17} />
            Snapshot
          </Button>
        </section>

        <section className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Grid3X3 size={16} />
            CSV import
          </div>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-border bg-control px-3 py-2 font-mono text-xs text-text outline-none focus:border-accent"
            onChange={(event) => setCsvSource(event.currentTarget.value)}
            spellCheck={false}
            value={csvSource}
          />
          <Button
            className="flex h-9 items-center gap-2 rounded-lg bg-control px-3 text-sm text-text hover:bg-surface-muted"
            onClick={() =>
              run(
                () => boardActions.insertTableFromCsv(csvSource),
                "CSV импортирован как editable table.",
              )
            }
            type="button"
          >
            <Import size={16} />
            Create table
          </Button>
        </section>

        <section className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Search size={16} />
            Element search
          </div>
          <input
            className="h-9 w-full rounded-lg border border-border bg-control px-3 text-sm text-text outline-none focus:border-accent"
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            placeholder="Найти по title, label, text, table cells, code..."
            value={searchQuery}
          />
          <div className="max-h-36 space-y-1 overflow-y-auto">
            {searchResults.map((result) => (
              <Button
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-control"
                key={result.id}
                onClick={() => {
                  boardActions.focusElement(result.id);
                  productivityToolsStore.close();
                }}
                type="button"
              >
                <span className="block truncate font-medium">{result.label}</span>
                <span className="block truncate text-xs text-text-muted">{result.meta}</span>
              </Button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 border-t border-border pt-4 max-sm:grid-cols-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <History size={16} />
              Version history
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {snapshots.map((snapshot) => (
                <Button
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs text-text hover:bg-control"
                  key={snapshot.id}
                  onClick={() => run(() => boardActions.restoreSnapshot(snapshot.id), "Snapshot восстановлен.")}
                  type="button"
                >
                  <span className="block font-medium">{snapshot.name}</span>
                  <span className="text-text-muted">{formatTime(snapshot.createdAt)}</span>
                </Button>
              ))}
              {snapshots.length === 0 && (
                <p className="m-0 text-xs text-text-muted">Snapshot пока нет.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <MonitorPlay size={16} />
              Frame slides
            </div>
            {frames.length > 0 && (
              <Button
                className="mb-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-control px-3 text-sm text-text hover:bg-surface-muted"
                onClick={() => {
                  framePresentationStore.open(frames[0].id);
                  productivityToolsStore.close();
                }}
                type="button"
              >
                <MonitorPlay size={16} />
                Start presentation
              </Button>
            )}
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {frames.map((frame) => (
                <Button
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs text-text hover:bg-control"
                  key={frame.id}
                  onClick={() => {
                    framePresentationStore.open(frame.id);
                    productivityToolsStore.close();
                  }}
                  type="button"
                >
                  {frame.name}
                </Button>
              ))}
              {frames.length === 0 && (
                <p className="m-0 text-xs text-text-muted">Создай frame, чтобы использовать slides.</p>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            className="flex h-9 items-center gap-2 rounded-lg bg-control px-3 text-sm text-text hover:bg-surface-muted"
            onClick={() => run(boardActions.exportDrawToolFile, ".drawtool файл сохранён.")}
            type="button"
          >
            <Download size={16} />
            Export .drawtool
          </Button>
          <Button
            className="flex h-9 items-center gap-2 rounded-lg bg-control px-3 text-sm text-text hover:bg-surface-muted"
            onClick={() => importInputRef.current?.click()}
            type="button"
          >
            <Import size={16} />
            Import .drawtool
          </Button>
          <input
            ref={importInputRef}
            accept=".drawtool,.json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) {
                run(() => boardActions.importDrawToolFile(file), "Файл импортирован.");
              }
              event.currentTarget.value = "";
            }}
            type="file"
          />
          <Button
            className="flex h-9 items-center gap-2 rounded-lg bg-control px-3 text-sm text-text hover:bg-surface-muted"
            onClick={() => run(boardActions.applyBrandKit, "Brand kit применён к выделению.")}
            type="button"
          >
            <Sparkles size={16} />
            Apply style kit
          </Button>
        </section>

        {status && (
          <p className="m-0 rounded-lg border border-border bg-control px-3 py-2 text-xs text-text-muted">
            {status}
          </p>
        )}
      </div>
    </Modal>
  );
}

