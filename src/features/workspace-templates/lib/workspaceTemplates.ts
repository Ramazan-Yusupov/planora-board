import type { Board, BoardCard, BoardChecklistTemplate, BoardCustomFieldTemplate } from "@/entities/board";
import type { Note, NoteBlock, NoteBlockType } from "@/features/manage-notes";
import { createId } from "@/shared/lib";

export type BoardWorkflowTemplateId = "sprint" | "bug-triage" | "content-plan";
export type NoteTemplateId = "meeting" | "decision" | "research";

export type BoardWorkflowTemplate = Readonly<{
  id: BoardWorkflowTemplateId;
  title: string;
  description: string;
  listTitles: readonly string[];
  cards: readonly Readonly<{
    description: string;
    dueInDays?: number;
    listTitle: string;
    priority: BoardCard["priority"];
    status: BoardCard["status"];
    title: string;
  }>[];
  checklistTemplates: readonly string[];
  customFieldTemplates: readonly string[];
}>;

export type NoteTemplate = Readonly<{
  id: NoteTemplateId;
  title: string;
  description: string;
  blocks: readonly Readonly<{
    checked?: boolean;
    tableCells?: string[][];
    tableHasHeaderRow?: boolean;
    text: string;
    type: NoteBlockType;
  }>[];
}>;

export const BOARD_WORKFLOW_TEMPLATES: readonly BoardWorkflowTemplate[] = [
  {
    id: "sprint",
    title: "Sprint workflow",
    description: "Backlog, planning, delivery, review and done flow.",
    listTitles: ["Sprint Backlog", "Ready", "In progress", "Review", "Done"],
    cards: [
      {
        title: "Собрать цели спринта",
        description: "Определить outcome, риски и критерии готовности.",
        listTitle: "Sprint Backlog",
        priority: "high",
        status: "todo",
        dueInDays: 1,
      },
      {
        title: "Проверить scope",
        description: "Убрать лишнее и оставить задачи, которые реально закрыть.",
        listTitle: "Ready",
        priority: "medium",
        status: "todo",
        dueInDays: 2,
      },
      {
        title: "Review и demo",
        description: "Проверить результат, собрать обратную связь и обновить notes.",
        listTitle: "Review",
        priority: "medium",
        status: "doing",
        dueInDays: 7,
      },
    ],
    checklistTemplates: ["Definition of done", "Release checklist"],
    customFieldTemplates: ["Риск", "Владелец"],
  },
  {
    id: "bug-triage",
    title: "Bug triage",
    description: "Очередь дефектов, воспроизведение, фикс и проверка.",
    listTitles: ["Inbox", "Reproducing", "Fixing", "Verification"],
    cards: [
      {
        title: "Собрать баг-репорты",
        description: "Проверить входящие ошибки, логи и шаги воспроизведения.",
        listTitle: "Inbox",
        priority: "high",
        status: "todo",
      },
      {
        title: "Подтвердить критичные дефекты",
        description: "Отделить реальные блокеры от шумных сигналов.",
        listTitle: "Reproducing",
        priority: "urgent",
        status: "doing",
        dueInDays: 1,
      },
    ],
    checklistTemplates: ["Bug report checklist", "Regression checklist"],
    customFieldTemplates: ["Severity", "Environment"],
  },
  {
    id: "content-plan",
    title: "Content plan",
    description: "Идеи, черновики, редактура и публикация.",
    listTitles: ["Ideas", "Draft", "Editing", "Scheduled", "Published"],
    cards: [
      {
        title: "Собрать идеи",
        description: "Сгруппировать темы по проектам, задачам и заметкам.",
        listTitle: "Ideas",
        priority: "low",
        status: "todo",
      },
      {
        title: "Подготовить календарь публикаций",
        description: "Назначить даты и владельцев для ближайших материалов.",
        listTitle: "Scheduled",
        priority: "medium",
        status: "todo",
        dueInDays: 5,
      },
    ],
    checklistTemplates: ["Publishing checklist", "Editorial checklist"],
    customFieldTemplates: ["Channel", "Audience"],
  },
];

export const NOTE_TEMPLATES: readonly NoteTemplate[] = [
  {
    id: "meeting",
    title: "Meeting notes",
    description: "Повестка, решения, задачи и follow-up.",
    blocks: [
      { type: "heading1", text: "Встреча" },
      { type: "heading2", text: "Повестка" },
      { type: "bulleted", text: "Контекст" },
      { type: "bulleted", text: "Решения" },
      { type: "heading2", text: "Action items" },
      { type: "todo", text: "Назначить владельца", checked: false },
      { type: "todo", text: "Обновить доску", checked: false },
    ],
  },
  {
    id: "decision",
    title: "Decision record",
    description: "Фиксация решения, альтернатив и последствий.",
    blocks: [
      { type: "heading1", text: "Decision record" },
      { type: "quote", text: "Коротко: какое решение принято и почему." },
      { type: "heading2", text: "Контекст" },
      { type: "paragraph", text: "" },
      { type: "heading2", text: "Альтернативы" },
      {
        type: "table",
        text: "",
        tableHasHeaderRow: true,
        tableCells: [
          ["Вариант", "Плюсы", "Минусы"],
          ["", "", ""],
          ["", "", ""],
        ],
      },
    ],
  },
  {
    id: "research",
    title: "Research brief",
    description: "Гипотеза, источники, выводы и связанные задачи.",
    blocks: [
      { type: "heading1", text: "Research brief" },
      { type: "callout", text: "Главный вопрос исследования" },
      { type: "heading2", text: "Источники" },
      { type: "bulleted", text: "Ссылка или заметка" },
      { type: "heading2", text: "Выводы" },
      { type: "numbered", text: "Первый вывод" },
      { type: "numbered", text: "Следующий шаг" },
    ],
  },
];

function getDateInDays(days: number | undefined): string | undefined {
  if (days === undefined) {
    return undefined;
  }

  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function createCard(
  cardTemplate: BoardWorkflowTemplate["cards"][number],
  listId: string,
  timestamp: number,
): BoardCard {
  return {
    id: createId("card"),
    listId,
    title: cardTemplate.title,
    description: cardTemplate.description,
    status: cardTemplate.status,
    priority: cardTemplate.priority,
    dueDate: getDateInDays(cardTemplate.dueInDays),
    labelIds: [],
    memberIds: [],
    customFields: [],
    checklistIds: [],
    attachmentIds: [],
    commentIds: [],
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function appendUniqueChecklistTemplates(
  board: Board,
  titles: readonly string[],
  timestamp: number,
): BoardChecklistTemplate[] {
  const existingTitles = new Set(
    board.checklistTemplates.map((template) => template.title.toLocaleLowerCase("ru-RU")),
  );
  const nextTemplates = [...board.checklistTemplates];

  for (const title of titles) {
    const normalizedTitle = title.trim().replace(/\s+/g, " ").slice(0, 120);

    if (
      !normalizedTitle ||
      existingTitles.has(normalizedTitle.toLocaleLowerCase("ru-RU")) ||
      nextTemplates.length >= 10
    ) {
      continue;
    }

    existingTitles.add(normalizedTitle.toLocaleLowerCase("ru-RU"));
    nextTemplates.push({
      id: createId("checklist-template"),
      title: normalizedTitle,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return nextTemplates;
}

function appendUniqueCustomFieldTemplates(
  board: Board,
  names: readonly string[],
  timestamp: number,
): BoardCustomFieldTemplate[] {
  const existingNames = new Set(
    board.customFieldTemplates.map((template) => template.name.toLocaleLowerCase("ru-RU")),
  );
  const nextTemplates = [...board.customFieldTemplates];

  for (const name of names) {
    const normalizedName = name.trim().replace(/\s+/g, " ").slice(0, 64);

    if (!normalizedName || existingNames.has(normalizedName.toLocaleLowerCase("ru-RU"))) {
      continue;
    }

    existingNames.add(normalizedName.toLocaleLowerCase("ru-RU"));
    nextTemplates.push({
      id: createId("custom-field-template"),
      name: normalizedName,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return nextTemplates;
}

export function applyBoardWorkflowTemplate(
  board: Board,
  templateId: BoardWorkflowTemplateId,
): Board {
  const template = BOARD_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);

  if (!template) {
    return board;
  }

  const timestamp = Date.now();
  const lists = { ...board.lists };
  const cards = { ...board.cards };
  const listIds = [...board.listIds];
  const listIdsByTitle = new Map<string, string>();

  template.listTitles.forEach((title) => {
    const listId = createId("list");

    listIdsByTitle.set(title, listId);
    listIds.push(listId);
    lists[listId] = {
      id: listId,
      title,
      cardIds: [],
      isArchived: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  template.cards.forEach((cardTemplate) => {
    const listId = listIdsByTitle.get(cardTemplate.listTitle);

    if (!listId) {
      return;
    }

    const card = createCard(cardTemplate, listId, timestamp);
    cards[card.id] = card;
    lists[listId] = {
      ...lists[listId],
      cardIds: [...lists[listId].cardIds, card.id],
      updatedAt: timestamp,
    };
  });

  return {
    ...board,
    checklistTemplates: appendUniqueChecklistTemplates(
      board,
      template.checklistTemplates,
      timestamp,
    ),
    customFieldTemplates: appendUniqueCustomFieldTemplates(
      board,
      template.customFieldTemplates,
      timestamp,
    ),
    cards,
    listIds,
    lists,
    updatedAt: timestamp,
  };
}

export function createNoteFromTemplate(
  boardId: string | undefined,
  templateId: NoteTemplateId,
): Note | null {
  const template = NOTE_TEMPLATES.find((item) => item.id === templateId);

  if (!template) {
    return null;
  }

  const timestamp = Date.now();
  const blocks: NoteBlock[] = template.blocks.map((block) => ({
    id: createId("note-block"),
    text: block.text,
    type: block.type,
    checked: block.checked,
    tableCells: block.tableCells,
    tableHasHeaderRow: block.tableHasHeaderRow,
  }));

  return {
    id: createId("note"),
    boardId,
    title: template.title,
    blocks,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
