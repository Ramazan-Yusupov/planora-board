"use client";

import {
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ListChecks,
  Search,
  Tag,
} from "lucide-react";
import { useMemo } from "react";

import {
  BoardLabelSelector,
  getCardChecklistProgress,
  getCardLabels,
  getOrderedBoardLabels,
  type Board,
  type BoardLabel,
} from "@/entities/board";
import {
  isCardMatchingFilters,
  toCardFilters,
  type CalendarCardFilters,
} from "@/features/filter-cards";
import {
  formatDayLabel,
  formatMonthTitle,
  getCalendarDays,
  getCalendarItems,
  type CalendarItem,
} from "@/features/view-calendar";
import { cn } from "@/shared/lib";
import { Button, IconButton } from "@/shared/ui";

type CalendarViewProps = Readonly<{
  boards: readonly Board[];
  filters: CalendarCardFilters;
  month: Date;
  selectedBoardId: string | null;
  onChangeFilters: (filters: CalendarCardFilters) => void;
  onOpenCard: (item: CalendarItem) => void;
  onSelectBoard: (boardId: string | null) => void;
  onShiftMonth: (offset: number) => void;
  onShowToday: () => void;
}>;

const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getCalendarLabels(
  boards: readonly Board[],
  selectedBoardId: string | null,
): BoardLabel[] {
  const visibleBoards = selectedBoardId
    ? boards.filter((board) => board.id === selectedBoardId)
    : boards;
  const labelsById = new Map<string, BoardLabel>();

  for (const board of visibleBoards) {
    for (const label of getOrderedBoardLabels(board)) {
      if (!labelsById.has(label.id)) {
        labelsById.set(label.id, label);
      }
    }
  }

  return [...labelsById.values()];
}

export function CalendarView({
  boards,
  filters,
  month,
  selectedBoardId,
  onChangeFilters,
  onOpenCard,
  onSelectBoard,
  onShiftMonth,
  onShowToday,
}: CalendarViewProps) {
  const days = useMemo(() => getCalendarDays(month), [month]);
  const availableLabels = useMemo(
    () => getCalendarLabels(boards, selectedBoardId),
    [boards, selectedBoardId],
  );
  const itemsByDate = useMemo(() => {
    const nextItemsByDate = new Map<string, CalendarItem[]>();
    const cardFilters = toCardFilters(filters);

    for (const [dateKey, items] of getCalendarItems(boards, selectedBoardId)) {
      const filteredItems = items.filter((item) =>
        isCardMatchingFilters(item.card, cardFilters),
      );

      if (filteredItems.length > 0) {
        nextItemsByDate.set(dateKey, filteredItems);
      }
    }

    return nextItemsByDate;
  }, [boards, filters, selectedBoardId]);
  const monthTitle = formatMonthTitle(month);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas text-text">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-panel/50 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1">
          <IconButton
            className="text-text-muted hover:bg-control hover:text-text"
            label="Предыдущий месяц"
            onClick={() => onShiftMonth(-1)}
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </IconButton>
          <IconButton
            className="text-text-muted hover:bg-control hover:text-text"
            label="Следующий месяц"
            onClick={() => onShiftMonth(1)}
          >
            <ChevronRight aria-hidden="true" size={18} />
          </IconButton>
        </div>

        <h1 className="min-w-40 text-lg font-semibold capitalize">{monthTitle}</h1>

        <Button size="sm" variant="secondary" onClick={onShowToday}>
          Сегодня
        </Button>

        <div className="flex w-full flex-wrap items-center gap-2 xl:ml-auto xl:w-auto xl:flex-nowrap">
          <label className="relative min-w-[min(100%,14rem)] flex-1 xl:w-56 xl:flex-none">
            <span className="sr-only">Поиск задач в календаре</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-control/45 py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted"
              placeholder="Поиск задач"
              value={filters.query}
              onChange={(event) =>
                onChangeFilters({ ...filters, query: event.target.value })
              }
            />
          </label>

          <label className="min-w-[min(100%,11rem)] flex-1 text-sm text-text-muted xl:w-48 xl:flex-none">
            <span className="sr-only">Фильтр по проекту</span>
            <select
              className="h-10 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text"
              value={selectedBoardId ?? ""}
              onChange={(event) => onSelectBoard(event.target.value || null)}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="w-full border-t border-white/10 pt-3">
          <div className="flex items-center gap-2 text-sm font-medium text-text">
            <Tag aria-hidden="true" size={16} />
            <span>Метки</span>
          </div>
          <div className="mt-2">
            <BoardLabelSelector
              labels={availableLabels}
              selectedLabelIds={filters.labelIds}
              onChange={(labelIds) => onChangeFilters({ ...filters, labelIds })}
              emptyMessage="Нет меток для фильтрации в выбранных проектах."
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
        <div className="min-w-[46rem] overflow-hidden rounded-2xl border border-white/10 bg-panel/60 shadow-sm">
          <div className="grid grid-cols-7 border-b border-white/10 bg-control/35">
            {weekdayLabels.map((weekday) => (
              <div
                key={weekday}
                className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-text-muted"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const items = itemsByDate.get(day.dateKey) ?? [];
              const visibleItems = items.slice(0, 3);
              const hiddenItemsCount = Math.max(0, items.length - visibleItems.length);

              return (
                <section
                  key={day.dateKey}
                  aria-label={formatDayLabel(day.date)}
                  className={cn(
                    "min-h-32 border-b border-r border-white/10 p-2 last:border-r-0",
                    !day.isCurrentMonth && "bg-slate-950/25",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full text-sm font-medium",
                        day.isToday
                          ? "bg-accent text-accent-foreground"
                          : day.isCurrentMonth
                            ? "text-text"
                            : "text-text-muted",
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const labels = getCardLabels(item.card, item.labels).slice(0, 2);
                      const checklistProgress = getCardChecklistProgress(
                        item.card,
                        item.checklists,
                        item.checklistItems,
                      );

                      return (
                        <button
                          key={`${item.boardId}-${item.card.id}`}
                          className="flex w-full items-center gap-1.5 rounded-lg border border-white/10 bg-control/55 px-2 py-1 text-left text-xs text-text transition hover:bg-control-hover focus-visible:outline-offset-1"
                          title={`${item.boardTitle}: ${item.card.title}`}
                          type="button"
                          onClick={() => onOpenCard(item)}
                        >
                          {item.card.sticker ? (
                            <span
                              aria-hidden="true"
                              className="shrink-0 text-sm leading-none"
                            >
                              {item.card.sticker}
                            </span>
                          ) : (
                            <CircleDot
                              aria-hidden="true"
                              className="shrink-0 text-accent"
                              size={12}
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate">{item.card.title}</span>
                          {checklistProgress.total > 0 ? (
                            <span
                              className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-text-muted"
                              title={`Чек-лист: ${checklistProgress.completed} из ${checklistProgress.total}`}
                            >
                              <ListChecks aria-hidden="true" size={12} />
                              {checklistProgress.completed}/{checklistProgress.total}
                            </span>
                          ) : null}
                          {labels.length > 0 ? (
                            <span className="flex shrink-0 gap-0.5" aria-label="Метки карточки">
                              {labels.map((label) => (
                                <span
                                  key={label.id}
                                  className="size-1.5 rounded-full"
                                  style={{ backgroundColor: label.color }}
                                  title={label.name}
                                />
                              ))}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}

                    {hiddenItemsCount > 0 ? (
                      <p className="px-2 text-xs text-text-muted">
                        Ещё {hiddenItemsCount}
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
