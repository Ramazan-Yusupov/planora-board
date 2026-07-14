export const CARD_DUE_FILTER_OPTIONS = [
  { value: "all", label: "Любой срок" },
  { value: "noDate", label: "Без срока" },
  { value: "overdue", label: "Просроченные" },
  { value: "today", label: "Сегодня" },
  { value: "next7Days", label: "Ближайшие 7 дней" },
  { value: "later", label: "Позже" },
] as const;

export type CardDueFilter = (typeof CARD_DUE_FILTER_OPTIONS)[number]["value"];

export const CARD_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Любой статус" },
  { value: "none", label: "Без статуса" },
  { value: "todo", label: "К выполнению" },
  { value: "doing", label: "В работе" },
  { value: "blocked", label: "Заблокировано" },
  { value: "done", label: "Готово" },
] as const;

export const CARD_PRIORITY_FILTER_OPTIONS = [
  { value: "all", label: "Любой приоритет" },
  { value: "none", label: "Без приоритета" },
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочно" },
] as const;

export type CardStatusFilter = (typeof CARD_STATUS_FILTER_OPTIONS)[number]["value"];
export type CardPriorityFilter = (typeof CARD_PRIORITY_FILTER_OPTIONS)[number]["value"];

export type CardFilters = Readonly<{
  query: string;
  labelIds: string[];
  dueDate: CardDueFilter;
  status: CardStatusFilter;
  priority: CardPriorityFilter;
  listId: string | "all";
}>;

export type CalendarCardFilters = Readonly<
  Pick<CardFilters, "query" | "labelIds">
>;

export const DEFAULT_CARD_FILTERS: CardFilters = {
  query: "",
  labelIds: [],
  dueDate: "all",
  status: "all",
  priority: "all",
  listId: "all",
};

export const DEFAULT_CALENDAR_CARD_FILTERS: CalendarCardFilters = {
  query: "",
  labelIds: [],
};
