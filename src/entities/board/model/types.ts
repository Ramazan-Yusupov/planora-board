export const LABEL_OPTIONS = [
  { value: "none", label: "Без метки", color: "" },
  { value: "blue", label: "Идея", color: "bg-sky-500" },
  { value: "violet", label: "В работе", color: "bg-violet-500" },
  { value: "orange", label: "Срочно", color: "bg-orange-500" },
  { value: "green", label: "Готово", color: "bg-emerald-500" },
] as const;

export type LabelValue = (typeof LABEL_OPTIONS)[number]["value"];

export type BoardCard = {
  id: string;
  listId: string;
  title: string;
  description: string;
  dueDate?: string;
  label: LabelValue;
  createdAt: number;
  updatedAt: number;
};

export type BoardList = {
  id: string;
  title: string;
  cardIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type Board = {
  id: string;
  title: string;
  listIds: string[];
  lists: Record<string, BoardList>;
  cards: Record<string, BoardCard>;
  createdAt: number;
  updatedAt: number;
};

export type CardDraft = Pick<BoardCard, "title" | "description" | "dueDate" | "label">;
