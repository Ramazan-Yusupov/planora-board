import {
  CARD_PRIORITY_OPTIONS,
  CARD_STATUS_OPTIONS,
  type Board,
  type BoardCard,
  type BoardCardOption,
  type BoardChecklistTemplate,
  type BoardCustomFieldTemplate,
  type BoardLabel,
} from "@/entities/board";
import type { Note, NoteBlock, NoteBlockType } from "@/features/manage-notes";
import { createId } from "@/shared/lib";

export type BoardWorkflowTemplateId = "sprint" | "bug-triage" | "content-plan";
export type BoardMarketplaceTemplateId =
  | "product-launch-kit"
  | "design-review-kit"
  | "ops-risk-kit";
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

export type BoardMarketplaceTemplate = Readonly<{
  id: BoardMarketplaceTemplateId;
  title: string;
  description: string;
  labels: readonly Readonly<{ color: string; name: string }>[];
  statuses: readonly Readonly<{ color: string; name: string }>[];
  priorities: readonly Readonly<{ color: string; name: string }>[];
  checklistTemplates: readonly string[];
  customFieldTemplates: readonly string[];
  coverColors: readonly string[];
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

export const BOARD_MARKETPLACE_TEMPLATES: readonly BoardMarketplaceTemplate[] = [
  {
    id: "product-launch-kit",
    title: "Product launch kit",
    description: "Метки, статусы и поля для запуска продукта или крупной функции.",
    labels: [
      { name: "Launch", color: "#38bdf8" },
      { name: "Marketing", color: "#f472b6" },
      { name: "Customer", color: "#22c55e" },
    ],
    statuses: [
      { name: "Ready for launch", color: "#22c55e" },
      { name: "Launch blocked", color: "#ef4444" },
    ],
    priorities: [{ name: "Launch critical", color: "#f97316" }],
    checklistTemplates: ["Launch readiness", "Post-launch review"],
    customFieldTemplates: ["Launch owner", "Target segment"],
    coverColors: ["#0ea5e9", "#22c55e", "#f97316"],
  },
  {
    id: "design-review-kit",
    title: "Design review kit",
    description: "Набор для UI/UX ревью, решений и визуального контроля качества.",
    labels: [
      { name: "UX", color: "#8b5cf6" },
      { name: "Visual QA", color: "#06b6d4" },
      { name: "Accessibility", color: "#f59e0b" },
    ],
    statuses: [
      { name: "Needs review", color: "#f59e0b" },
      { name: "Approved", color: "#10b981" },
    ],
    priorities: [{ name: "Design blocker", color: "#e11d48" }],
    checklistTemplates: ["Design QA", "Accessibility pass"],
    customFieldTemplates: ["Reviewer", "Design link"],
    coverColors: ["#8b5cf6", "#06b6d4", "#f59e0b"],
  },
  {
    id: "ops-risk-kit",
    title: "Ops risk kit",
    description: "Шаблоны для рисков, инцидентов, блокеров и операционного контроля.",
    labels: [
      { name: "Risk", color: "#ef4444" },
      { name: "Dependency", color: "#f97316" },
      { name: "Ops", color: "#64748b" },
    ],
    statuses: [
      { name: "At risk", color: "#f97316" },
      { name: "Mitigated", color: "#22c55e" },
    ],
    priorities: [{ name: "Escalation", color: "#dc2626" }],
    checklistTemplates: ["Risk mitigation", "Incident follow-up"],
    customFieldTemplates: ["Risk owner", "Impact"],
    coverColors: ["#ef4444", "#f97316", "#64748b"],
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

function normalizeTemplateText(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeHexColor(value: string, fallback = "#64748B"): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : fallback;
}

function hasName(
  names: ReadonlySet<string>,
  value: string,
): boolean {
  return names.has(value.toLocaleLowerCase("ru-RU"));
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

function appendUniqueLabels(
  board: Board,
  labels: BoardMarketplaceTemplate["labels"],
  timestamp: number,
): Pick<Board, "labelIds" | "labels"> {
  const existingNames = new Set(
    board.labelIds.flatMap((labelId) => {
      const label = board.labels[labelId];

      return label ? [label.name.toLocaleLowerCase("ru-RU")] : [];
    }),
  );
  const nextLabelIds = [...board.labelIds];
  const nextLabels = { ...board.labels };

  for (const labelTemplate of labels) {
    const name = normalizeTemplateText(labelTemplate.name, 32);

    if (!name || hasName(existingNames, name) || nextLabelIds.length >= 10) {
      continue;
    }

    const id = createId("label");
    const label: BoardLabel = {
      id,
      name,
      color: normalizeHexColor(labelTemplate.color),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    existingNames.add(name.toLocaleLowerCase("ru-RU"));
    nextLabelIds.push(id);
    nextLabels[id] = label;
  }

  return {
    labelIds: nextLabelIds,
    labels: nextLabels,
  };
}

function appendUniqueOptions(
  options: readonly BoardCardOption[],
  templates: BoardMarketplaceTemplate["statuses"],
  timestamp: number,
  prefix: string,
  builtInCount: number,
): BoardCardOption[] {
  const existingNames = new Set(
    options.map((option) => option.name.toLocaleLowerCase("ru-RU")),
  );
  const nextOptions = [...options];

  for (const template of templates) {
    const name = normalizeTemplateText(template.name, 48);

    if (
      !name ||
      hasName(existingNames, name) ||
      builtInCount + nextOptions.length >= 10
    ) {
      continue;
    }

    existingNames.add(name.toLocaleLowerCase("ru-RU"));
    nextOptions.push({
      id: createId(prefix),
      name,
      color: normalizeHexColor(template.color),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return nextOptions;
}

function appendUniqueCoverColors(
  board: Board,
  coverColors: readonly string[],
): string[] {
  const nextColors = [...board.coverColors];

  for (const color of coverColors) {
    const normalizedColor = normalizeHexColor(color);

    if (!nextColors.includes(normalizedColor) && nextColors.length < 10) {
      nextColors.push(normalizedColor);
    }
  }

  return nextColors;
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

export function applyBoardMarketplaceTemplate(
  board: Board,
  templateId: BoardMarketplaceTemplateId,
): Board {
  const template = BOARD_MARKETPLACE_TEMPLATES.find((item) => item.id === templateId);

  if (!template) {
    return board;
  }

  const timestamp = Date.now();
  const nextLabels = appendUniqueLabels(board, template.labels, timestamp);
  const cardStatuses = appendUniqueOptions(
    board.cardStatuses,
    template.statuses,
    timestamp,
    "status",
    CARD_STATUS_OPTIONS.length,
  );
  const cardPriorities = appendUniqueOptions(
    board.cardPriorities,
    template.priorities,
    timestamp,
    "priority",
    CARD_PRIORITY_OPTIONS.length,
  );
  const checklistTemplates = appendUniqueChecklistTemplates(
    board,
    template.checklistTemplates,
    timestamp,
  );
  const customFieldTemplates = appendUniqueCustomFieldTemplates(
    board,
    template.customFieldTemplates,
    timestamp,
  );
  const coverColors = appendUniqueCoverColors(board, template.coverColors);

  if (
    nextLabels.labelIds.length === board.labelIds.length &&
    cardStatuses.length === board.cardStatuses.length &&
    cardPriorities.length === board.cardPriorities.length &&
    checklistTemplates.length === board.checklistTemplates.length &&
    customFieldTemplates.length === board.customFieldTemplates.length &&
    coverColors.length === board.coverColors.length
  ) {
    return board;
  }

  return {
    ...board,
    ...nextLabels,
    cardStatuses,
    cardPriorities,
    checklistTemplates,
    customFieldTemplates,
    coverColors,
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
