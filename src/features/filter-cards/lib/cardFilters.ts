import type { Board, BoardCard } from "@/entities/board";

import {
  DEFAULT_CARD_FILTERS,
  type CardFilters,
  type CalendarCardFilters,
} from "../model/types";

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function isDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function matchesQuery(card: BoardCard, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = `${card.title}\n${card.description}`.toLocaleLowerCase(
    "ru-RU",
  );

  return searchableText.includes(normalizedQuery);
}

function matchesDueDate(
  dueDate: string | undefined,
  filter: CardFilters["dueDate"],
  referenceDate: Date,
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "noDate") {
    return !isDateKey(dueDate);
  }

  if (!isDateKey(dueDate)) {
    return false;
  }

  const today = getDateKey(referenceDate);

  if (filter === "overdue") {
    return dueDate < today;
  }

  if (filter === "today") {
    return dueDate === today;
  }

  const nextWeek = getDateKey(addDays(referenceDate, 7));

  if (filter === "next7Days") {
    return dueDate > today && dueDate <= nextWeek;
  }

  return dueDate > nextWeek;
}

export function isCardMatchingFilters(
  card: BoardCard,
  filters: Pick<CardFilters, "query" | "labelIds" | "dueDate">,
  referenceDate = new Date(),
): boolean {
  if (card.isArchived) {
    return false;
  }

  if (
    filters.labelIds.length > 0 &&
    !filters.labelIds.some((labelId) => card.labelIds.includes(labelId))
  ) {
    return false;
  }

  if (!matchesQuery(card, filters.query)) {
    return false;
  }

  return matchesDueDate(card.dueDate, filters.dueDate, referenceDate);
}

export function getVisibleCardIdsByList(
  board: Board,
  filters: CardFilters,
  referenceDate = new Date(),
): Record<string, string[]> {
  return Object.fromEntries(
    board.listIds.map((listId) => {
      const list = board.lists[listId];

      if (!list) {
        return [listId, []];
      }

      const cardIds = list.cardIds.filter((cardId) => {
        const card = board.cards[cardId];

        if (!card) {
          return false;
        }

        if (filters.listId !== "all" && filters.listId !== listId) {
          return false;
        }

        return isCardMatchingFilters(card, filters, referenceDate);
      });

      return [listId, cardIds];
    }),
  );
}

export function getActiveCardFiltersCount(filters: CardFilters): number {
  let count = 0;

  if (filters.query.trim()) {
    count += 1;
  }

  if (filters.labelIds.length > 0) {
    count += 1;
  }

  if (filters.dueDate !== DEFAULT_CARD_FILTERS.dueDate) {
    count += 1;
  }

  if (filters.listId !== DEFAULT_CARD_FILTERS.listId) {
    count += 1;
  }

  return count;
}

export function hasActiveCardFilters(filters: CardFilters): boolean {
  return getActiveCardFiltersCount(filters) > 0;
}

export function toCardFilters(
  filters: CalendarCardFilters,
): Pick<CardFilters, "query" | "labelIds" | "dueDate"> {
  return {
    query: filters.query,
    labelIds: filters.labelIds,
    dueDate: "all",
  };
}
