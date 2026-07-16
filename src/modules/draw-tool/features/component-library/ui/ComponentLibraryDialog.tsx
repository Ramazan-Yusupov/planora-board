import { useReducer, useState, useSyncExternalStore } from "react";
import { Layers3, PackageOpen, Trash2 } from "lucide-react";
import { boardActions, type LibraryItem } from "@/modules/draw-tool/features/board-actions";
import { Button, IconButton, Modal } from "@/modules/draw-tool/shared/ui";
import { componentLibraryDialogStore } from "../model/componentLibraryDialogStore";

function formatCreatedAt(value: number) {
  if (!Number.isFinite(value)) return "Дата не указана";

  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function getElementCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return `${count} элемент`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} элемента`;
  }

  return `${count} элементов`;
}

function ComponentCard({
  item,
  onDelete,
  onInsert,
}: {
  item: LibraryItem;
  onDelete: (item: LibraryItem) => void;
  onInsert: (itemId: string) => void;
}) {
  return (
    <article className="group flex items-center gap-3 rounded-xl border border-border/80 bg-control/55 p-3 transition-colors hover:border-border hover:bg-control/85">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-border/70 bg-surface-muted text-text-muted transition-colors group-hover:text-text">
        <PackageOpen aria-hidden size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-text">
          {item.name.trim() || "Без названия"}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Layers3 aria-hidden size={13} />
            {getElementCountLabel(item.elements.length)}
          </span>
          <span>{formatCreatedAt(item.createdAt)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <IconButton
          aria-label={`Удалить компонент «${item.name.trim() || "Без названия"}»`}
          className="grid size-9 place-items-center rounded-lg border border-transparent text-text-muted transition-colors hover:border-red-500/25 hover:bg-red-500/15 hover:text-red-300"
          onClick={() => onDelete(item)}
          title="Удалить компонент"
          type="button"
        >
          <Trash2 aria-hidden size={16} />
        </IconButton>

        <Button
          className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-slate-950 transition-opacity hover:opacity-90"
          onClick={() => onInsert(item.id)}
          type="button"
        >
          Вставить
        </Button>
      </div>
    </article>
  );
}

export function ComponentLibraryDialog() {
  const isOpen = useSyncExternalStore(
    componentLibraryDialogStore.subscribe,
    componentLibraryDialogStore.get,
    componentLibraryDialogStore.get,
  );
  const [status, setStatus] = useState<string | null>(null);
  const [, refreshLibrary] = useReducer((revision: number) => revision + 1, 0);
  const items = isOpen ? boardActions.getLibraryItems() : [];

  function close() {
    setStatus(null);
    componentLibraryDialogStore.close();
  }

  function insert(itemId: string) {
    const inserted = boardActions.insertLibraryItem(itemId);
    if (!inserted) {
      setStatus("Не удалось вставить компонент.");
      return;
    }

    close();
  }

  function remove(item: LibraryItem) {
    const name = item.name.trim() || "Без названия";
    if (!window.confirm(`Удалить компонент «${name}»?`)) return;

    const deleted = boardActions.deleteLibraryItem(item.id);
    if (!deleted) {
      setStatus("Не удалось удалить компонент.");
      return;
    }

    setStatus(null);
    refreshLibrary();
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Компоненты">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <p className="m-0 max-w-md text-sm leading-6 text-text-muted">
            Все сохранённые компоненты находятся здесь. Выберите нужный, чтобы
            вставить его на доску.
          </p>
          {items.length > 0 && (
            <span className="shrink-0 rounded-full border border-border/80 bg-control px-2.5 py-1 text-xs font-medium text-text-muted">
              {items.length}
            </span>
          )}
        </div>

        {items.length > 0 ? (
          <div className="max-h-[min(56dvh,560px)] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {items.map((item) => (
              <ComponentCard
                item={item}
                key={item.id}
                onDelete={remove}
                onInsert={insert}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border bg-control/35 px-6 text-center">
            <div>
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-border/80 bg-surface-muted text-text-muted">
                <PackageOpen aria-hidden size={22} />
              </div>
              <h3 className="text-sm font-semibold text-text">
                Сохранённых компонентов пока нет
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-text-muted">
                Выделите элементы на доске и сохраните их через контекстное меню
                командой «В библиотеку».
              </p>
            </div>
          </div>
        )}

        {status && (
          <p className="m-0 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {status}
          </p>
        )}
      </div>
    </Modal>
  );
}

