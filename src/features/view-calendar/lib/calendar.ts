import type {
  Board,
  BoardCard,
  BoardChecklist,
  BoardChecklistItem,
  BoardLabel,
} from "@/entities/board";

export type CalendarDay = Readonly<{
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}>;

export type CalendarItem = Readonly<{
  boardId: string;
  boardTitle: string;
  card: BoardCard;
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  checklists: Readonly<Record<string, BoardChecklist>>;
  labels: Readonly<Record<string, BoardLabel>>;
}>;

const DAYS_IN_WEEK = 7;
const CALENDAR_WEEKS = 6;

function createLocalDate(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function shiftMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export function getCalendarDays(month: Date, today = new Date()): CalendarDay[] {
  const monthStart = getMonthStart(month);
  const mondayBasedOffset = (monthStart.getDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;
  const gridStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    monthStart.getDate() - mondayBasedOffset,
  );
  const todayKey = getDateKey(today);

  return Array.from({ length: DAYS_IN_WEEK * CALENDAR_WEEKS }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    );

    return {
      date,
      dateKey: getDateKey(date),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: getDateKey(date) === todayKey,
    };
  });
}

export function getCalendarItems(
  boards: readonly Board[],
  boardId: string | null,
): Map<string, CalendarItem[]> {
  const itemsByDate = new Map<string, CalendarItem[]>();
  const visibleBoards = boardId
    ? boards.filter((board) => board.id === boardId)
    : boards;

  for (const board of visibleBoards) {
    for (const card of Object.values(board.cards)) {
      if (
        card.isArchived ||
        board.lists[card.listId]?.isArchived ||
        !card.dueDate ||
        !createLocalDate(card.dueDate)
      ) {
        continue;
      }

      const items = itemsByDate.get(card.dueDate) ?? [];
      items.push({
        boardId: board.id,
        boardTitle: board.title,
        card,
        checklistItems: board.checklistItems,
        checklists: board.checklists,
        labels: board.labels,
      });
      itemsByDate.set(card.dueDate, items);
    }
  }

  for (const items of itemsByDate.values()) {
    items.sort((first, second) => first.card.title.localeCompare(second.card.title, "ru"));
  }

  return itemsByDate;
}

export function formatMonthTitle(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(date);
}
