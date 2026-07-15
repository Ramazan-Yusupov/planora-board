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

export const BOARD_PROJECT_TEMPLATES = [
  { id: "blank", name: "Пустая доска" },
  { id: "frontend", name: "Frontend" },
  { id: "backend", name: "Backend" },
  { id: "sprint", name: "Sprint" },
  { id: "bug-tracker", name: "Bug tracker" },
] as const;

export type BoardProjectTemplateId =
  (typeof BOARD_PROJECT_TEMPLATES)[number]["id"];

type TemplateCard = Readonly<{
  title: string;
  description?: string;
  labelIds?: string[];
  priority?: Board["cards"][string]["priority"];
  status?: Board["cards"][string]["status"];
}>;

type TemplateList = Readonly<{
  title: string;
  cards?: readonly TemplateCard[];
}>;

type BoardProjectTemplate = Readonly<{
  lists: readonly TemplateList[];
}>;

const boardProjectTemplateDefinitions: Record<
  Exclude<BoardProjectTemplateId, "blank">,
  BoardProjectTemplate
> = {
  frontend: {
    lists: [
      {
        title: "Backlog",
        cards: [
          {
            title: "Собрать требования к экрану",
            description: "Зафиксировать состояния, адаптив и основные действия.",
            labelIds: ["label-idea"],
            priority: "medium",
          },
          {
            title: "Проверить accessibility",
            description: "Фокус, Escape, aria-label и управление с клавиатуры.",
            labelIds: ["label-urgent"],
            priority: "high",
          },
        ],
      },
      {
        title: "UI",
        cards: [
          {
            title: "Сверстать основной сценарий",
            description: "Сначала рабочий интерфейс, затем полировка состояний.",
            labelIds: ["label-progress"],
            status: "doing",
          },
        ],
      },
      { title: "Review" },
      { title: "Done" },
    ],
  },
  backend: {
    lists: [
      {
        title: "API",
        cards: [
          {
            title: "Описать контракт данных",
            description: "Поля, ошибки, валидация и обратная совместимость.",
            labelIds: ["label-idea"],
          },
        ],
      },
      {
        title: "Implementation",
        cards: [
          {
            title: "Добавить runtime validation",
            description: "Не доверять входящему JSON без проверки схемой.",
            labelIds: ["label-progress"],
            priority: "high",
            status: "doing",
          },
        ],
      },
      { title: "Tests" },
      { title: "Release" },
    ],
  },
  sprint: {
    lists: [
      { title: "Sprint backlog" },
      {
        title: "In progress",
        cards: [
          {
            title: "Выбрать задачи на спринт",
            description: "Оставить только реально выполнимый объём.",
            labelIds: ["label-progress"],
            status: "doing",
          },
        ],
      },
      { title: "Blocked" },
      { title: "Done" },
    ],
  },
  "bug-tracker": {
    lists: [
      {
        title: "New",
        cards: [
          {
            title: "Описать шаги воспроизведения",
            description: "Что ожидали, что произошло, где видно ошибку.",
            labelIds: ["label-urgent"],
            priority: "high",
          },
        ],
      },
      { title: "Confirmed" },
      { title: "Fixing" },
      { title: "Verified" },
    ],
  },
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

export function createBoardFromTemplate(
  title: string,
  templateId: BoardProjectTemplateId = "blank",
): Board {
  if (templateId === "blank") {
    return createEmptyBoard(title);
  }

  const template = boardProjectTemplateDefinitions[templateId];
  const board = createEmptyBoard(title);
  const createdAt = Date.now();
  const listIds = template.lists.map(() => createId("list"));
  const lists: Board["lists"] = {};
  const cards: Board["cards"] = {};

  template.lists.forEach((listTemplate, listIndex) => {
    const listId = listIds[listIndex];
    const cardIds = (listTemplate.cards ?? []).map(() => createId("card"));

    lists[listId] = {
      id: listId,
      title: listTemplate.title,
      cardIds,
      isArchived: false,
      createdAt,
      updatedAt: createdAt,
    };

    listTemplate.cards?.forEach((cardTemplate, cardIndex) => {
      const cardId = cardIds[cardIndex];

      cards[cardId] = {
        id: cardId,
        listId,
        title: cardTemplate.title,
        description: cardTemplate.description ?? "",
        status: cardTemplate.status ?? "none",
        priority: cardTemplate.priority ?? "none",
        customFields: [],
        labelIds: cardTemplate.labelIds ?? [],
        memberIds: [],
        checklistIds: [],
        attachmentIds: [],
        commentIds: [],
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      };
    });
  });

  return {
    ...board,
    listIds,
    lists,
    cards,
    createdAt,
    updatedAt: createdAt,
  };
}
