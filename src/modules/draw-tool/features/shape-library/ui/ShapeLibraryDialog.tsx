import { useMemo, useState, useSyncExternalStore } from "react";
import { LibraryBig, Search } from "lucide-react";
import { Button, Modal } from "@/modules/draw-tool/shared/ui";
import { insertShapeLibraryItem } from "../model/insertShapeLibraryItem";
import {
  SHAPE_LIBRARY_CATEGORIES,
  SHAPE_LIBRARY_ITEMS,
  type ShapeLibraryItem,
} from "../model/shapeLibraryItems";
import { shapeLibraryDialogStore } from "../model/shapeLibraryDialogStore";

function ShapeLibraryCard({
  item,
  onInsert,
}: {
  item: ShapeLibraryItem;
  onInsert: (item: ShapeLibraryItem) => void;
}) {
  const Icon = item.icon;

  return (
    <article className="group flex min-h-28 flex-col rounded-xl border border-border/80 bg-control/45 p-3 transition-colors hover:border-border hover:bg-control/80">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/70 bg-surface-muted text-text-muted transition-colors group-hover:text-text">
          <Icon aria-hidden size={19} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text">
            {item.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">
            {item.description}
          </p>
        </div>
      </div>

      <Button
        className="mt-auto h-8 rounded-lg bg-accent px-3 text-xs font-semibold text-slate-950 transition-opacity hover:opacity-90"
        onClick={() => onInsert(item)}
        type="button"
      >
        Вставить
      </Button>
    </article>
  );
}

function filterItems(query: string, category: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return SHAPE_LIBRARY_ITEMS.filter((item) => {
    const matchesCategory = category === "Все" || item.category === category;
    const searchable = [
      item.title,
      item.description,
      item.category,
      ...item.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

export function ShapeLibraryDialog() {
  const isOpen = useSyncExternalStore(
    shapeLibraryDialogStore.subscribe,
    shapeLibraryDialogStore.get,
    shapeLibraryDialogStore.get,
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все");
  const items = useMemo(() => filterItems(query, category), [category, query]);

  function close() {
    setQuery("");
    setCategory("Все");
    shapeLibraryDialogStore.close();
  }

  function insert(item: ShapeLibraryItem) {
    insertShapeLibraryItem(item);
    close();
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Shape Library">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <p className="m-0 max-w-xl text-sm leading-6 text-text-muted">
            Встроенный каталог draw.io-style фигур: flowchart, network/cloud,
            UML/BPMN, ERD и UI-шаблоны. Фигуры вставляются в центр текущего
            viewport и сразу выделяются.
          </p>
          <span className="shrink-0 rounded-full border border-border/80 bg-control px-2.5 py-1 text-xs font-medium text-text-muted">
            {SHAPE_LIBRARY_ITEMS.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              className="h-10 w-full rounded-xl border border-border bg-control pl-9 pr-3 text-sm text-text outline-none focus:border-accent"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Поиск: API, UML, database, wireframe..."
              value={query}
            />
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {["Все", ...SHAPE_LIBRARY_CATEGORIES].map((item) => {
            const active = item === category;
            return (
              <Button
                className={`h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors ${
                  active
                    ? "border-accent bg-accent text-slate-950"
                    : "border-border bg-control text-text-muted hover:text-text"
                }`}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </Button>
            );
          })}
        </div>

        {items.length > 0 ? (
          <div className="grid max-h-[min(58dvh,620px)] grid-cols-2 gap-3 overflow-y-auto overscroll-contain pr-1 max-sm:grid-cols-1 lg:grid-cols-3">
            {items.map((item) => (
              <ShapeLibraryCard item={item} key={item.id} onInsert={insert} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border bg-control/35 px-6 text-center">
            <div>
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-border/80 bg-surface-muted text-text-muted">
                <LibraryBig aria-hidden size={22} />
              </div>
              <h3 className="text-sm font-semibold text-text">
                Ничего не найдено
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-text-muted">
                Попробуйте другой запрос или категорию.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

