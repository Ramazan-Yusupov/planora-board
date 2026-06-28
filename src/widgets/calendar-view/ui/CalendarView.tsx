"use client";

import { ChevronLeft, ChevronRight, CircleDot } from "lucide-react";
import { useMemo } from "react";

import type { Board } from "@/entities/board";
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
  month: Date;
  selectedBoardId: string | null;
  onOpenCard: (item: CalendarItem) => void;
  onSelectBoard: (boardId: string | null) => void;
  onShiftMonth: (offset: number) => void;
  onShowToday: () => void;
}>;

const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarView({
  boards,
  month,
  selectedBoardId,
  onOpenCard,
  onSelectBoard,
  onShiftMonth,
  onShowToday,
}: CalendarViewProps) {
  const days = useMemo(() => getCalendarDays(month), [month]);
  const itemsByDate = useMemo(
    () => getCalendarItems(boards, selectedBoardId),
    [boards, selectedBoardId],
  );
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

        <label className="ml-auto flex min-w-[min(100%,15rem)] items-center gap-2 text-sm text-text-muted">
          <span className="sr-only">Фильтр по проекту</span>
          <select
            className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text"
            value={selectedBoardId ?? ""}
            onChange={(event) => onSelectBoard(event.target.value || null)}
          >
            <option value="">Все проекты</option>
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.title}
              </option>
            ))}
          </select>
        </label>
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
                    {visibleItems.map((item) => (
                      <button
                        key={`${item.boardId}-${item.card.id}`}
                        className="flex w-full items-center gap-1.5 rounded-lg border border-white/10 bg-control/55 px-2 py-1 text-left text-xs text-text transition hover:bg-control-hover focus-visible:outline-offset-1"
                        title={`${item.boardTitle}: ${item.card.title}`}
                        type="button"
                        onClick={() => onOpenCard(item)}
                      >
                        <CircleDot
                          aria-hidden="true"
                          className="shrink-0 text-accent"
                          size={12}
                        />
                        <span className="truncate">{item.card.title}</span>
                      </button>
                    ))}

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
