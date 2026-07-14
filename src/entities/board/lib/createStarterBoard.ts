import { createId } from "@/shared/lib";

import { DEFAULT_BOARD_APPEARANCE } from "./appearance";
import { createDefaultBoardLabelCollection } from "./labels";
import {
  CARD_COVER_COLOR_OPTIONS,
  type Board,
  type BoardAppearance,
} from "../model/types";

type StarterBoardOptions = {
  id?: string;
  title?: string;
  appearance?: BoardAppearance;
  createdAt?: number;
};

function resolveAppearance(appearance?: BoardAppearance): BoardAppearance {
  return {
    ...DEFAULT_BOARD_APPEARANCE,
    ...appearance,
  };
}

export function createStarterBoard(options: StarterBoardOptions = {}): Board {
  const createdAt = options.createdAt ?? Date.now();
  const id = options.id ?? "starter-board";
  const title = options.title?.trim() || "Мой проект";
  const labels = createDefaultBoardLabelCollection(createdAt);

  return {
    id,
    title,
    appearance: resolveAppearance(options.appearance),
    cardStatusLabels: {},
    cardPriorityLabels: {},
    cardStatuses: [],
    cardPriorities: [],
    coverColors: [...CARD_COVER_COLOR_OPTIONS],
    customFieldTemplates: [],
    checklistTemplates: [],
    ...labels,
    memberIds: ["member-you", "member-design"],
    members: {
      "member-you": {
        id: "member-you",
        name: "Вы",
        avatarColor: "#2563eb",
        createdAt,
        updatedAt: createdAt,
      },
      "member-design": {
        id: "member-design",
        name: "Дизайн",
        avatarColor: "#db2777",
        createdAt,
        updatedAt: createdAt,
      },
    },
    checklistIds: [],
    checklists: {},
    checklistItems: {},
    commentIds: [],
    comments: {},
    attachmentIds: [],
    attachments: {},
    activityIds: [],
    activities: {},
    listIds: ["list-ideas", "list-progress", "list-done"],
    lists: {
      "list-ideas": {
        id: "list-ideas",
        title: "Идеи",
        cardIds: ["card-welcome", "card-brief"],
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      "list-progress": {
        id: "list-progress",
        title: "В работе",
        cardIds: ["card-design"],
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      "list-done": {
        id: "list-done",
        title: "Готово",
        cardIds: [],
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
    },
    cards: {
      "card-welcome": {
        id: "card-welcome",
        listId: "list-ideas",
        title: "Откройте карточку и отредактируйте её",
        description: "В карточке доступны название, описание, срок и несколько цветных меток.",
        status: "none",
        priority: "none",
        customFields: [
          {
            id: "field-welcome-owner",
            name: "Тип",
            value: "Онбординг",
            createdAt,
            updatedAt: createdAt,
          },
        ],
        labelIds: ["label-idea"],
        memberIds: ["member-you"],
        checklistIds: [],
        attachmentIds: [],
        commentIds: [],
        sticker: "👋",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      "card-brief": {
        id: "card-brief",
        listId: "list-ideas",
        title: "Добавьте новую задачу",
        description: "Нажмите кнопку «Добавить карточку» внизу списка.",
        status: "none",
        priority: "low",
        customFields: [],
        labelIds: [],
        memberIds: [],
        checklistIds: [],
        attachmentIds: [],
        commentIds: [],
        sticker: "➕",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      "card-design": {
        id: "card-design",
        listId: "list-progress",
        title: "Перетащите карточку между колонками",
        description: "Можно менять порядок карточек внутри одной колонки или переносить их в другую.",
        status: "doing",
        priority: "high",
        customFields: [
          {
            id: "field-design-risk",
            name: "Риск",
            value: "Проверить поведение на мобильном",
            createdAt,
            updatedAt: createdAt,
          },
        ],
        labelIds: ["label-progress"],
        memberIds: ["member-you", "member-design"],
        checklistIds: [],
        attachmentIds: [],
        commentIds: [],
        sticker: "↔️",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
    },
    createdAt,
    updatedAt: createdAt,
  };
}

export function createEmptyBoard(title: string): Board {
  const createdAt = Date.now();
  const listId = createId("list");
  const labels = createDefaultBoardLabelCollection(createdAt);

  return {
    id: createId("board"),
    title: title.trim() || "Новый проект",
    appearance: { ...DEFAULT_BOARD_APPEARANCE },
    cardStatusLabels: {},
    cardPriorityLabels: {},
    cardStatuses: [],
    cardPriorities: [],
    coverColors: [...CARD_COVER_COLOR_OPTIONS],
    customFieldTemplates: [],
    checklistTemplates: [],
    ...labels,
    memberIds: [],
    members: {},
    checklistIds: [],
    checklists: {},
    checklistItems: {},
    commentIds: [],
    comments: {},
    attachmentIds: [],
    attachments: {},
    activityIds: [],
    activities: {},
    listIds: [listId],
    lists: {
      [listId]: {
        id: listId,
        title: "Новые задачи",
        cardIds: [],
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
    },
    cards: {},
    createdAt,
    updatedAt: createdAt,
  };
}
