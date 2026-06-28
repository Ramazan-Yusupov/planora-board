export const CARD_DUE_FILTER_OPTIONS = [
  { value: "all", label: "Любой срок" },
  { value: "noDate", label: "Без срока" },
  { value: "overdue", label: "Просроченные" },
  { value: "today", label: "Сегодня" },
  { value: "next7Days", label: "Ближайшие 7 дней" },
  { value: "later", label: "Позже" },
] as const;

export type CardDueFilter = (typeof CARD_DUE_FILTER_OPTIONS)[number]["value"];

export type CardFilters = Readonly<{
  query: string;
  labelIds: string[];
  dueDate: CardDueFilter;
  listId: string | "all";
}>;

export type CalendarCardFilters = Readonly<
  Pick<CardFilters, "query" | "labelIds">
>;

export const DEFAULT_CARD_FILTERS: CardFilters = {
  query: "",
  labelIds: [],
  dueDate: "all",
  listId: "all",
};

export const DEFAULT_CALENDAR_CARD_FILTERS: CalendarCardFilters = {
  query: "",
  labelIds: [],
};
