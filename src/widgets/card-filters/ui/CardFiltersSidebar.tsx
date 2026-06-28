"use client";

import { CalendarDays, ListFilter, RotateCcw, Search, Tag, X } from "lucide-react";
import { useEffect, useId } from "react";

import { LABEL_OPTIONS, type BoardList } from "@/entities/board";
import {
  CARD_DUE_FILTER_OPTIONS,
  DEFAULT_CARD_FILTERS,
  type CardFilters,
} from "@/features/filter-cards";
import { IconButton } from "@/shared/ui";

type CardFiltersSidebarProps = Readonly<{
  filters: CardFilters;
  isOpen: boolean;
  lists: readonly BoardList[];
  onChange: (filters: CardFilters) => void;
  onClose: () => void;
}>;

export function CardFiltersSidebar({
  filters,
  isOpen,
  lists,
  onChange,
  onClose,
}: CardFiltersSidebarProps) {
  const searchId = useId();
  const labelId = useId();
  const dueDateId = useId();
  const listId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const patchFilters = (patch: Partial<CardFilters>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <aside
      aria-label="Фильтры карточек"
      className={`absolute inset-y-0 right-0 z-40 flex w-[min(88vw,23rem)] shrink-0 flex-col border-l border-white/10 bg-panel/95 shadow-2xl backdrop-blur-xl transition-transform duration-200 lg:w-96 ${
        isOpen
          ? "translate-x-0 lg:relative lg:translate-x-0"
          : "translate-x-full lg:absolute lg:translate-x-full"
      }`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <ListFilter aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Карточки
            </p>
            <h2 className="mt-1 text-base font-semibold text-text">Поиск и фильтры</h2>
          </div>
        </div>
        <IconButton
          className="text-text-muted hover:bg-control hover:text-text"
          label="Закрыть фильтры"
          size="lg"
          onClick={onClose}
        >
          <X aria-hidden="true" size={20} />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div>
          <label
            className="flex items-center gap-2 text-sm font-medium text-text"
            htmlFor={searchId}
          >
            <Search aria-hidden="true" size={17} />
            Найти карточку
          </label>
          <input
            id={searchId}
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text placeholder:text-text-muted"
            placeholder="Название или описание"
            value={filters.query}
            onChange={(event) => patchFilters({ query: event.target.value })}
          />
        </div>

        <div className="mt-6">
          <label
            className="flex items-center gap-2 text-sm font-medium text-text"
            htmlFor={labelId}
          >
            <Tag aria-hidden="true" size={17} />
            Метка
          </label>
          <select
            id={labelId}
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text"
            value={filters.label}
            onChange={(event) =>
              patchFilters({
                label: event.target.value as CardFilters["label"],
              })
            }
          >
            <option value="all">Все метки</option>
            {LABEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <label
            className="flex items-center gap-2 text-sm font-medium text-text"
            htmlFor={dueDateId}
          >
            <CalendarDays aria-hidden="true" size={17} />
            Срок
          </label>
          <select
            id={dueDateId}
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text"
            value={filters.dueDate}
            onChange={(event) =>
              patchFilters({
                dueDate: event.target.value as CardFilters["dueDate"],
              })
            }
          >
            {CARD_DUE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <label
            className="flex items-center gap-2 text-sm font-medium text-text"
            htmlFor={listId}
          >
            <ListFilter aria-hidden="true" size={17} />
            Список
          </label>
          <select
            id={listId}
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text"
            value={filters.listId}
            onChange={(event) => patchFilters({ listId: event.target.value })}
          >
            <option value="all">Все списки</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.title}
              </option>
            ))}
          </select>
        </div>

        <button
          className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-text-muted transition hover:bg-control hover:text-text"
          type="button"
          onClick={() => onChange({ ...DEFAULT_CARD_FILTERS })}
        >
          <RotateCcw aria-hidden="true" size={17} />
          Сбросить фильтры
        </button>
      </div>
    </aside>
  );
}
