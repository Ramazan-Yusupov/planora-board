export const BOARD_BACKGROUND_OPTIONS = [
  {
    value: "midnight",
    label: "Полночь",
    color: "#0f172a",
    backgroundImage: "radial-gradient(circle at 15% 18%, rgba(59, 130, 246, 0.28), transparent 34%), radial-gradient(circle at 82% 4%, rgba(14, 165, 233, 0.18), transparent 27%)",
  },
  {
    value: "ocean",
    label: "Океан",
    color: "#083344",
    backgroundImage: "radial-gradient(circle at 10% 12%, rgba(34, 211, 238, 0.32), transparent 34%), radial-gradient(circle at 82% 84%, rgba(14, 116, 144, 0.45), transparent 36%)",
  },
  {
    value: "violet",
    label: "Фиолетовый",
    color: "#2e1065",
    backgroundImage: "radial-gradient(circle at 16% 20%, rgba(196, 181, 253, 0.26), transparent 30%), radial-gradient(circle at 86% 70%, rgba(109, 40, 217, 0.38), transparent 40%)",
  },
  {
    value: "forest",
    label: "Лес",
    color: "#052e16",
    backgroundImage: "radial-gradient(circle at 10% 16%, rgba(74, 222, 128, 0.23), transparent 30%), radial-gradient(circle at 88% 78%, rgba(22, 101, 52, 0.42), transparent 40%)",
  },
  {
    value: "ember",
    label: "Закат",
    color: "#431407",
    backgroundImage: "radial-gradient(circle at 12% 14%, rgba(251, 146, 60, 0.35), transparent 30%), radial-gradient(circle at 86% 82%, rgba(190, 24, 93, 0.28), transparent 42%)",
  },
  {
    value: "custom",
    label: "Свой цвет",
    color: "#334155",
    backgroundImage: "none",
  },
] as const;

export const CARD_COLOR_OPTIONS = [
  { value: "slate", label: "Графит", color: "#1e293b" },
  { value: "navy", label: "Ночной синий", color: "#172554" },
  { value: "plum", label: "Слива", color: "#3b1d4a" },
  { value: "sand", label: "Тёплый песок", color: "#f5e7cf" },
  { value: "frost", label: "Светлый иней", color: "#e2e8f0" },
  { value: "custom", label: "Свой цвет", color: "#334155" },
] as const;

export const CARD_COVER_COLOR_OPTIONS = [
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#64748b",
] as const;

export type BoardBackgroundValue = (typeof BOARD_BACKGROUND_OPTIONS)[number]["value"];
export type CardColorValue = (typeof CARD_COLOR_OPTIONS)[number]["value"];

export type BoardAppearance = {
  background: BoardBackgroundValue;
  customBackgroundColor?: string;
  cardColor: CardColorValue;
  customCardColor?: string;
};

export type BoardLabel = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
};

export type BoardLabelDraft = Pick<BoardLabel, "name" | "color">;

export type BoardMember = {
  id: string;
  name: string;
  avatarColor: string;
  createdAt: number;
  updatedAt: number;
};

export type BoardMemberDraft = Pick<BoardMember, "name" | "avatarColor">;

export type BoardComment = {
  id: string;
  cardId: string;
  authorName: string;
  message: string;
  createdAt: number;
  updatedAt: number;
};

export type BoardChecklist = {
  id: string;
  cardId: string;
  title: string;
  itemIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type BoardChecklistItem = {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
};

export const CARD_STATUS_OPTIONS = [
  { value: "none", label: "Без статуса", color: "#64748b" },
  { value: "todo", label: "К выполнению", color: "#94a3b8" },
  { value: "doing", label: "В работе", color: "#38bdf8" },
  { value: "blocked", label: "Заблокировано", color: "#f97316" },
  { value: "done", label: "Готово", color: "#22c55e" },
] as const;

export const CARD_PRIORITY_OPTIONS = [
  { value: "none", label: "Без приоритета", color: "#64748b" },
  { value: "low", label: "Низкий", color: "#64748b" },
  { value: "medium", label: "Средний", color: "#0ea5e9" },
  { value: "high", label: "Высокий", color: "#f59e0b" },
  { value: "urgent", label: "Срочно", color: "#ef4444" },
] as const;

export type CardStatus = string;
export type CardPriority = string;

export type BoardCardOption = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
};

export type BoardCardCustomField = {
  id: string;
  name: string;
  value: string;
  createdAt: number;
  updatedAt: number;
};

export type BoardCustomFieldTemplate = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type BoardChecklistTemplate = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

/**
 * Журнал хранится в доменной модели, но не показывается в обычной карточке.
 * Админский интерфейс появится после серверной авторизации.
 */
export type BoardActivityType =
  | "card-created"
  | "card-title-updated"
  | "card-description-updated"
  | "card-due-date-set"
  | "card-due-date-changed"
  | "card-due-date-removed"
  | "card-labels-updated"
  | "card-members-updated"
  | "card-priority-updated"
  | "card-status-updated"
  | "card-start-date-updated"
  | "card-custom-fields-updated"
  | "card-sticker-updated"
  | "card-moved"
  | "card-archived"
  | "card-restored"
  | "card-duplicated"
  | "comment-created"
  | "comment-updated"
  | "comment-deleted"
  | "checklist-created"
  | "checklist-renamed"
  | "checklist-deleted"
  | "checklist-item-created"
  | "checklist-item-renamed"
  | "checklist-item-toggled"
  | "checklist-item-deleted"
  | "checklist-item-moved";

export type BoardActivity = {
  id: string;
  cardId: string;
  actorName: string;
  type: BoardActivityType;
  message: string;
  createdAt: number;
};

export type BoardAttachment = {
  id: string;
  cardId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
  updatedAt: number;
};

export type CardCover =
  | {
      type: "color";
      color: string;
    }
  | {
      type: "attachment";
      attachmentId: string;
    };

export type BoardCard = {
  id: string;
  listId: string;
  title: string;
  description: string;
  status: CardStatus;
  priority: CardPriority;
  startDate?: string;
  dueDate?: string;
  completedAt?: number;
  labelIds: string[];
  memberIds: string[];
  customFields: BoardCardCustomField[];
  checklistIds: string[];
  attachmentIds: string[];
  commentIds: string[];
  sticker?: string;
  cover?: CardCover;
  isArchived: boolean;
  archivedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type BoardList = {
  id: string;
  title: string;
  cardIds: string[];
  isArchived: boolean;
  archivedAt?: number;
  wipLimit?: number;
  createdAt: number;
  updatedAt: number;
};

export type Board = {
  id: string;
  title: string;
  appearance: BoardAppearance;
  cardStatusLabels: Partial<Record<CardStatus, string>>;
  cardPriorityLabels: Partial<Record<CardPriority, string>>;
  cardStatuses: BoardCardOption[];
  cardPriorities: BoardCardOption[];
  coverColors: string[];
  customFieldTemplates: BoardCustomFieldTemplate[];
  checklistTemplates: BoardChecklistTemplate[];
  labelIds: string[];
  labels: Record<string, BoardLabel>;
  memberIds: string[];
  members: Record<string, BoardMember>;
  checklistIds: string[];
  checklists: Record<string, BoardChecklist>;
  checklistItems: Record<string, BoardChecklistItem>;
  commentIds: string[];
  comments: Record<string, BoardComment>;
  attachmentIds: string[];
  attachments: Record<string, BoardAttachment>;
  activityIds: string[];
  activities: Record<string, BoardActivity>;
  listIds: string[];
  lists: Record<string, BoardList>;
  cards: Record<string, BoardCard>;
  createdAt: number;
  updatedAt: number;
};

export type BoardWorkspace = {
  boards: Board[];
  activeBoardId: string | null;
};

export type CardDraft = Pick<
  BoardCard,
  | "title"
  | "description"
  | "status"
  | "priority"
  | "startDate"
  | "dueDate"
  | "labelIds"
  | "customFields"
  | "sticker"
  | "cover"
>;
