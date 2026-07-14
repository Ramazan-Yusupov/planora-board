import {
  appendBoardActivities,
  CARD_PRIORITY_OPTIONS,
  CARD_STATUS_OPTIONS,
  formatActivityDueDate,
  getRandomCardSticker,
  normalizeCardLabelIds,
  normalizeCardSticker,
  removeCardActivities,
  removeCardChecklists,
  type Board,
  type BoardActivityInput,
  type BoardAppearance,
  type BoardAttachment,
  type BoardCard,
  type BoardCardOption,
  type BoardChecklist,
  type BoardChecklistTemplate,
  type BoardChecklistItem,
  type BoardCustomFieldTemplate,
  type BoardComment,
  type BoardList,
  type CardPriority,
  type CardCover,
  type CardDraft,
  type CardStatus,
} from "@/entities/board";
import { createId } from "@/shared/lib";

function now(): number {
  return Date.now();
}

function moveItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return nextItems;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function areStringArraysEqual(
  first: readonly string[],
  second: readonly string[],
): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function summarize(value: string, maxLength = 72): string {
  const normalized = value.trim().replace(/\s+/g, " ");

  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
    : normalized;
}

function describeLabels(board: Board, labelIds: readonly string[]): string {
  const names = labelIds.flatMap((labelId) => {
    const label = board.labels[labelId];
    return label ? [label.name] : [];
  });

  if (names.length === 0) {
    return "Удалены все метки.";
  }

  const visibleNames = names.slice(0, 3);
  const suffix = names.length > visibleNames.length ? ` и ещё ${names.length - visibleNames.length}` : "";

  return `Обновлены метки: ${visibleNames.join(", ")}${suffix}.`;
}

function describeStatus(status: BoardCard["status"]): string {
  return CARD_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function describePriority(priority: BoardCard["priority"]): string {
  return CARD_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority;
}

function normalizeDateKey(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function normalizeCustomFields(
  fields: CardDraft["customFields"],
  timestamp: number,
): CardDraft["customFields"] {
  return fields.flatMap((field) => {
    const name = field.name.trim().replace(/\s+/g, " ");
    const value = field.value.trim();

    if (!name && !value) {
      return [];
    }

    return [
      {
        id: field.id || createId("card-field"),
        name: name || "Поле",
        value,
        createdAt: field.createdAt || timestamp,
        updatedAt: timestamp,
      },
    ];
  });
}

function normalizeCardCover(
  board: Board,
  cardId: string,
  cover: CardCover | undefined,
): CardCover | undefined {
  if (!cover) {
    return undefined;
  }

  if (cover.type === "color") {
    return /^#[0-9a-fA-F]{6}$/.test(cover.color)
      ? { type: "color", color: cover.color }
      : undefined;
  }

  const attachment = board.attachments[cover.attachmentId];

  return attachment?.cardId === cardId ? cover : undefined;
}

function removeCardAttachments(
  board: Board,
  cardIds: ReadonlySet<string>,
): Pick<Board, "attachmentIds" | "attachments"> {
  const attachmentIds = board.attachmentIds.filter((attachmentId) => {
    const attachment = board.attachments[attachmentId];
    return attachment ? !cardIds.has(attachment.cardId) : false;
  });
  const attachments = Object.fromEntries(
    attachmentIds.flatMap((attachmentId) => {
      const attachment = board.attachments[attachmentId];
      return attachment ? [[attachmentId, attachment]] : [];
    }),
  ) as Record<string, BoardAttachment>;

  return { attachmentIds, attachments };
}

function removeCardComments(
  board: Board,
  cardIds: ReadonlySet<string>,
): Pick<Board, "commentIds" | "comments"> {
  const commentIds = board.commentIds.filter((commentId) => {
    const comment = board.comments[commentId];
    return comment ? !cardIds.has(comment.cardId) : false;
  });
  const comments = Object.fromEntries(
    commentIds.flatMap((commentId) => {
      const comment = board.comments[commentId];
      return comment ? [[commentId, comment]] : [];
    }),
  ) as Record<string, BoardComment>;

  return { commentIds, comments };
}

function removeCardsFromBoard(board: Board, cardIds: ReadonlySet<string>): Board {
  if (cardIds.size === 0) {
    return board;
  }

  const timestamp = now();
  const cards = Object.fromEntries(
    Object.entries(board.cards).filter(([cardId]) => !cardIds.has(cardId)),
  ) as Record<string, BoardCard>;
  const lists = Object.fromEntries(
    Object.entries(board.lists).map(([listId, list]) => [
      listId,
      list.cardIds.some((cardId) => cardIds.has(cardId))
        ? {
            ...list,
            cardIds: list.cardIds.filter((cardId) => !cardIds.has(cardId)),
            updatedAt: timestamp,
          }
        : list,
    ]),
  ) as Record<string, BoardList>;
  const relatedChecklists = removeCardChecklists(
    board.checklists,
    board.checklistItems,
    cardIds,
  );
  const relatedActivities = removeCardActivities(board, cardIds);
  const relatedAttachments = removeCardAttachments(board, cardIds);
  const relatedComments = removeCardComments(board, cardIds);

  return {
    ...board,
    lists,
    cards,
    checklistIds: board.checklistIds.filter(
      (checklistId) => Boolean(relatedChecklists.checklists[checklistId]),
    ),
    ...relatedChecklists,
    ...relatedActivities,
    ...relatedAttachments,
    ...relatedComments,
    updatedAt: timestamp,
  };
}

function copyCardChecklists(
  board: Board,
  sourceCard: BoardCard,
  targetCardId: string,
  timestamp: number,
): Readonly<{
  checklistIds: string[];
  checklists: Record<string, BoardChecklist>;
  checklistItems: Record<string, BoardChecklistItem>;
}> {
  const checklistIds: string[] = [];
  const checklists: Record<string, BoardChecklist> = {};
  const checklistItems: Record<string, BoardChecklistItem> = {};

  for (const sourceChecklistId of sourceCard.checklistIds) {
    const sourceChecklist = board.checklists[sourceChecklistId];

    if (!sourceChecklist) {
      continue;
    }

    const checklistId = createId("checklist");
    const itemIds: string[] = [];

    for (const sourceItemId of sourceChecklist.itemIds) {
      const sourceItem = board.checklistItems[sourceItemId];

      if (!sourceItem) {
        continue;
      }

      const itemId = createId("checklist-item");
      itemIds.push(itemId);
      checklistItems[itemId] = {
        ...sourceItem,
        id: itemId,
        checklistId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    checklistIds.push(checklistId);
    checklists[checklistId] = {
      ...sourceChecklist,
      id: checklistId,
      cardId: targetCardId,
      itemIds,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  return { checklistIds, checklists, checklistItems };
}

export function isListAtWipLimit(list: BoardList): boolean {
  return Boolean(list.wipLimit && list.cardIds.length >= list.wipLimit);
}

export function getActiveBoardListIds(board: Board): string[] {
  return board.listIds.filter((listId) => !board.lists[listId]?.isArchived);
}

export function renameBoard(board: Board, title: string): Board {
  const normalizedTitle = title.trim();

  return {
    ...board,
    title: normalizedTitle || "Новый проект",
    updatedAt: now(),
  };
}

export function updateBoardAppearance(board: Board, appearance: BoardAppearance): Board {
  return {
    ...board,
    appearance,
    updatedAt: now(),
  };
}

export function updateCardStatusLabel(
  board: Board,
  status: CardStatus,
  label: string,
): Board {
  const normalizedLabel = label.trim().replace(/\s+/g, " ");

  if (!normalizedLabel) {
    return board;
  }

  return {
    ...board,
    cardStatusLabels: {
      ...board.cardStatusLabels,
      [status]: normalizedLabel.slice(0, 48),
    },
    updatedAt: now(),
  };
}

export function updateCardPriorityLabel(
  board: Board,
  priority: CardPriority,
  label: string,
): Board {
  const normalizedLabel = label.trim().replace(/\s+/g, " ");

  if (!normalizedLabel) {
    return board;
  }

  return {
    ...board,
    cardPriorityLabels: {
      ...board.cardPriorityLabels,
      [priority]: normalizedLabel.slice(0, 48),
    },
    updatedAt: now(),
  };
}

function normalizeOptionName(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 48);
}

function normalizeOptionColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : "#64748B";
}

function createBoardOption(name: string, color: string, prefix: string): BoardCardOption | null {
  const normalizedName = normalizeOptionName(name);

  if (!normalizedName) {
    return null;
  }

  const timestamp = now();

  return {
    id: createId(prefix),
    name: normalizedName,
    color: normalizeOptionColor(color),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createCardStatusOption(board: Board, name: string, color: string): Board {
  if (CARD_STATUS_OPTIONS.length + board.cardStatuses.length >= 10) {
    return board;
  }

  const option = createBoardOption(name, color, "status");

  if (!option) {
    return board;
  }

  return {
    ...board,
    cardStatuses: [...board.cardStatuses, option],
    updatedAt: option.createdAt,
  };
}

export function updateCardStatusOption(
  board: Board,
  optionId: string,
  name: string,
  color: string,
): Board {
  const normalizedName = normalizeOptionName(name);

  if (!normalizedName) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    cardStatuses: board.cardStatuses.map((option) =>
      option.id === optionId
        ? {
            ...option,
            name: normalizedName,
            color: normalizeOptionColor(color),
            updatedAt: timestamp,
          }
        : option,
    ),
    updatedAt: timestamp,
  };
}

export function deleteCardStatusOption(board: Board, optionId: string): Board {
  if (!board.cardStatuses.some((option) => option.id === optionId)) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    cardStatuses: board.cardStatuses.filter((option) => option.id !== optionId),
    cards: Object.fromEntries(
      Object.entries(board.cards).map(([cardId, card]) => [
        cardId,
        card.status === optionId
          ? { ...card, status: "none", completedAt: undefined, updatedAt: timestamp }
          : card,
      ]),
    ) as Record<string, BoardCard>,
    updatedAt: timestamp,
  };
}

export function createCardPriorityOption(board: Board, name: string, color: string): Board {
  if (CARD_PRIORITY_OPTIONS.length + board.cardPriorities.length >= 10) {
    return board;
  }

  const option = createBoardOption(name, color, "priority");

  if (!option) {
    return board;
  }

  return {
    ...board,
    cardPriorities: [...board.cardPriorities, option],
    updatedAt: option.createdAt,
  };
}

export function updateCardPriorityOption(
  board: Board,
  optionId: string,
  name: string,
  color: string,
): Board {
  const normalizedName = normalizeOptionName(name);

  if (!normalizedName) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    cardPriorities: board.cardPriorities.map((option) =>
      option.id === optionId
        ? {
            ...option,
            name: normalizedName,
            color: normalizeOptionColor(color),
            updatedAt: timestamp,
          }
        : option,
    ),
    updatedAt: timestamp,
  };
}

export function deleteCardPriorityOption(board: Board, optionId: string): Board {
  if (!board.cardPriorities.some((option) => option.id === optionId)) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    cardPriorities: board.cardPriorities.filter((option) => option.id !== optionId),
    cards: Object.fromEntries(
      Object.entries(board.cards).map(([cardId, card]) => [
        cardId,
        card.priority === optionId ? { ...card, priority: "none", updatedAt: timestamp } : card,
      ]),
    ) as Record<string, BoardCard>,
    updatedAt: timestamp,
  };
}

export function createCustomFieldTemplate(
  board: Board,
  name: string,
): Board {
  if (board.customFieldTemplates.length >= 10) {
    return board;
  }

  const normalizedName = name.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
    return board;
  }

  const timestamp = now();
  const template: BoardCustomFieldTemplate = {
    id: createId("field-template"),
    name: normalizedName.slice(0, 64),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...board,
    customFieldTemplates: [...board.customFieldTemplates, template],
    updatedAt: timestamp,
  };
}

export function updateCustomFieldTemplate(
  board: Board,
  templateId: string,
  name: string,
): Board {
  const normalizedName = name.trim().replace(/\s+/g, " ");

  if (!normalizedName) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    customFieldTemplates: board.customFieldTemplates.map((template) =>
      template.id === templateId
        ? { ...template, name: normalizedName.slice(0, 64), updatedAt: timestamp }
        : template,
    ),
    updatedAt: timestamp,
  };
}

export function deleteCustomFieldTemplate(board: Board, templateId: string): Board {
  return {
    ...board,
    customFieldTemplates: board.customFieldTemplates.filter(
      (template) => template.id !== templateId,
    ),
    updatedAt: now(),
  };
}

export function createChecklistTemplate(board: Board, title: string): Board {
  if (board.checklistTemplates.length >= 10) {
    return board;
  }

  const normalizedTitle = title.trim().replace(/\s+/g, " ");

  if (!normalizedTitle) {
    return board;
  }

  const timestamp = now();
  const template: BoardChecklistTemplate = {
    id: createId("checklist-template"),
    title: normalizedTitle.slice(0, 120),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...board,
    checklistTemplates: [...board.checklistTemplates, template],
    updatedAt: timestamp,
  };
}

export function updateChecklistTemplate(
  board: Board,
  templateId: string,
  title: string,
): Board {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");

  if (!normalizedTitle) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    checklistTemplates: board.checklistTemplates.map((template) =>
      template.id === templateId
        ? { ...template, title: normalizedTitle.slice(0, 120), updatedAt: timestamp }
        : template,
    ),
    updatedAt: timestamp,
  };
}

export function deleteChecklistTemplate(board: Board, templateId: string): Board {
  return {
    ...board,
    checklistTemplates: board.checklistTemplates.filter(
      (template) => template.id !== templateId,
    ),
    updatedAt: now(),
  };
}

export function updateBoardCoverColors(board: Board, coverColors: readonly string[]): Board {
  const nextCoverColors = coverColors
    .map((color) => color.trim())
    .filter((color) => /^#[0-9a-fA-F]{6}$/.test(color))
    .map((color) => color.toUpperCase())
    .filter((color, index, colors) => colors.indexOf(color) === index)
    .slice(0, 10);

  return {
    ...board,
    coverColors: nextCoverColors,
    updatedAt: now(),
  };
}

export function addList(board: Board, title: string): Board {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    return board;
  }

  const timestamp = now();
  const listId = createId("list");

  return {
    ...board,
    listIds: [...board.listIds, listId],
    lists: {
      ...board.lists,
      [listId]: {
        id: listId,
        title: normalizedTitle,
        cardIds: [],
        isArchived: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
}

export function renameList(board: Board, listId: string, title: string): Board {
  const list = board.lists[listId];
  const normalizedTitle = title.trim();

  if (!list || !normalizedTitle) {
    return board;
  }

  const timestamp = now();
  return {
    ...board,
    lists: {
      ...board.lists,
      [listId]: {
        ...list,
        title: normalizedTitle,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
}

export function deleteList(board: Board, listId: string): Board {
  const list = board.lists[listId];
  if (!list) {
    return board;
  }

  const remainingLists = { ...board.lists };
  delete remainingLists[listId];
  const cardIdsToDelete = new Set(
    Object.entries(board.cards)
      .filter(([, card]) => card.listId === listId)
      .map(([cardId]) => cardId),
  );
  const boardWithoutCards = removeCardsFromBoard(board, cardIdsToDelete);

  return {
    ...boardWithoutCards,
    listIds: board.listIds.filter((id) => id !== listId),
    lists: remainingLists,
    updatedAt: now(),
  };
}

export function archiveList(board: Board, listId: string): Board {
  const list = board.lists[listId];

  if (!list || list.isArchived) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    lists: {
      ...board.lists,
      [listId]: {
        ...list,
        isArchived: true,
        archivedAt: timestamp,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
}

export function restoreList(board: Board, listId: string): Board {
  const list = board.lists[listId];

  if (!list || !list.isArchived) {
    return board;
  }

  const timestamp = now();
  const restoredList = { ...list, isArchived: false, updatedAt: timestamp };
  delete restoredList.archivedAt;

  return {
    ...board,
    lists: {
      ...board.lists,
      [listId]: restoredList,
    },
    updatedAt: timestamp,
  };
}

export function duplicateList(board: Board, listId: string): Board {
  const sourceList = board.lists[listId];

  if (!sourceList || sourceList.isArchived) {
    return board;
  }

  const timestamp = now();
  const newListId = createId("list");
  const nextCards: Record<string, BoardCard> = { ...board.cards };
  const nextChecklists: Record<string, BoardChecklist> = { ...board.checklists };
  const nextChecklistItems: Record<string, BoardChecklistItem> = {
    ...board.checklistItems,
  };
  const duplicateCardIds: string[] = [];
  const duplicatedChecklistIds: string[] = [];

  for (const sourceCardId of sourceList.cardIds) {
    const sourceCard = board.cards[sourceCardId];

    if (!sourceCard || sourceCard.isArchived) {
      continue;
    }

    const cardId = createId("card");
    const copiedChecklists = copyCardChecklists(board, sourceCard, cardId, timestamp);
    duplicateCardIds.push(cardId);
    duplicatedChecklistIds.push(...copiedChecklists.checklistIds);
      nextCards[cardId] = {
      ...sourceCard,
      id: cardId,
      listId: newListId,
      memberIds: [...sourceCard.memberIds],
      customFields: sourceCard.customFields.map((field) => ({
        ...field,
        id: createId("card-field"),
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
      checklistIds: copiedChecklists.checklistIds,
      attachmentIds: [],
      commentIds: [],
      cover: sourceCard.cover?.type === "color" ? sourceCard.cover : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    Object.assign(nextChecklists, copiedChecklists.checklists);
    Object.assign(nextChecklistItems, copiedChecklists.checklistItems);
  }

  const sourceIndex = board.listIds.indexOf(sourceList.id);
  const nextListIds = [...board.listIds];
  nextListIds.splice(sourceIndex + 1, 0, newListId);

  return {
    ...board,
    listIds: nextListIds,
    lists: {
      ...board.lists,
      [newListId]: {
        id: newListId,
        title: `${sourceList.title} (копия)`,
        cardIds: duplicateCardIds,
        isArchived: false,
        wipLimit: sourceList.wipLimit,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    cards: nextCards,
    checklistIds: [...board.checklistIds, ...duplicatedChecklistIds],
    checklists: nextChecklists,
    checklistItems: nextChecklistItems,
    updatedAt: timestamp,
  };
}

export function setListWipLimit(
  board: Board,
  listId: string,
  wipLimit: number | undefined,
): Board {
  const list = board.lists[listId];
  const normalizedLimit =
    wipLimit === undefined || !Number.isFinite(wipLimit) || wipLimit <= 0
      ? undefined
      : Math.min(999, Math.floor(wipLimit));

  if (!list || list.wipLimit === normalizedLimit) {
    return board;
  }

  const timestamp = now();
  const nextList = { ...list, wipLimit: normalizedLimit, updatedAt: timestamp };

  return {
    ...board,
    lists: {
      ...board.lists,
      [listId]: nextList,
    },
    updatedAt: timestamp,
  };
}

export function moveAllCards(
  board: Board,
  sourceListId: string,
  destinationListId: string,
): Board {
  const sourceList = board.lists[sourceListId];
  const destinationList = board.lists[destinationListId];

  if (
    !sourceList ||
    !destinationList ||
    sourceList.id === destinationList.id ||
    sourceList.isArchived ||
    destinationList.isArchived
  ) {
    return board;
  }

  const activeCardIds = sourceList.cardIds.filter((cardId) => !board.cards[cardId]?.isArchived);

  if (
    destinationList.wipLimit &&
    destinationList.cardIds.length + activeCardIds.length > destinationList.wipLimit
  ) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    lists: {
      ...board.lists,
      [sourceList.id]: {
        ...sourceList,
        cardIds: sourceList.cardIds.filter((cardId) => !activeCardIds.includes(cardId)),
        updatedAt: timestamp,
      },
      [destinationList.id]: {
        ...destinationList,
        cardIds: [...destinationList.cardIds, ...activeCardIds],
        updatedAt: timestamp,
      },
    },
    cards: Object.fromEntries(
      Object.entries(board.cards).map(([cardId, card]) => [
        cardId,
        activeCardIds.includes(cardId)
          ? { ...card, listId: destinationList.id, updatedAt: timestamp }
          : card,
      ]),
    ) as Record<string, BoardCard>,
    updatedAt: timestamp,
  };
}

export function clearList(board: Board, listId: string): Board {
  const list = board.lists[listId];

  if (!list || list.cardIds.length === 0) {
    return board;
  }

  return removeCardsFromBoard(board, new Set(list.cardIds));
}

export function addCard(board: Board, listId: string, title: string): Board {
  const list = board.lists[listId];
  const normalizedTitle = title.trim();

  if (!list || list.isArchived || !normalizedTitle || isListAtWipLimit(list)) {
    return board;
  }

  const timestamp = now();
  const cardId = createId("card");
  const nextBoard: Board = {
    ...board,
    lists: {
      ...board.lists,
      [listId]: {
        ...list,
        cardIds: [...list.cardIds, cardId],
        updatedAt: timestamp,
      },
    },
    cards: {
      ...board.cards,
      [cardId]: {
        id: cardId,
        listId,
        title: normalizedTitle,
        description: "",
        status: "none",
        priority: "none",
        customFields: [],
        labelIds: [],
        memberIds: [],
        checklistIds: [],
        attachmentIds: [],
        commentIds: [],
        sticker: getRandomCardSticker(),
        isArchived: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId,
      type: "card-created",
      message: `Создана карточка в списке «${summarize(list.title)}».`,
      createdAt: timestamp,
    },
  ]);
}

export function updateCard(board: Board, cardId: string, draft: CardDraft): Board {
  const card = board.cards[cardId];
  const normalizedTitle = draft.title.trim();

  if (!card || !normalizedTitle) {
    return board;
  }

  const timestamp = now();
  const nextStatus = draft.status;
  const nextCard: BoardCard = {
    ...card,
    title: normalizedTitle,
    description: draft.description.trim(),
    status: nextStatus,
    priority: draft.priority,
    startDate: normalizeDateKey(draft.startDate),
    dueDate: normalizeDateKey(draft.dueDate),
    completedAt:
      nextStatus === "done"
        ? card.status === "done"
          ? card.completedAt
          : timestamp
        : undefined,
    labelIds: normalizeCardLabelIds(draft.labelIds, board.labels),
    customFields: normalizeCustomFields(draft.customFields, timestamp),
    sticker: normalizeCardSticker(draft.sticker),
    cover: normalizeCardCover(board, cardId, draft.cover),
    updatedAt: timestamp,
  };
  const activities: BoardActivityInput[] = [];

  if (card.title !== nextCard.title) {
    activities.push({
      cardId,
      type: "card-title-updated",
      message: `Изменено название: «${summarize(card.title)}» → «${summarize(nextCard.title)}».`,
      createdAt: timestamp,
    });
  }

  if (card.description !== nextCard.description) {
    activities.push({
      cardId,
      type: "card-description-updated",
      message: nextCard.description ? "Обновлено описание карточки." : "Очищено описание карточки.",
      createdAt: timestamp,
    });
  }

  if (card.dueDate !== nextCard.dueDate) {
    if (!card.dueDate && nextCard.dueDate) {
      activities.push({
        cardId,
        type: "card-due-date-set",
        message: `Установлен срок: ${formatActivityDueDate(nextCard.dueDate)}.`,
        createdAt: timestamp,
      });
    } else if (card.dueDate && nextCard.dueDate) {
      activities.push({
        cardId,
        type: "card-due-date-changed",
        message: `Изменён срок: ${formatActivityDueDate(card.dueDate)} → ${formatActivityDueDate(nextCard.dueDate)}.`,
        createdAt: timestamp,
      });
    } else {
      activities.push({
        cardId,
        type: "card-due-date-removed",
        message: "Удалён срок карточки.",
        createdAt: timestamp,
      });
    }
  }

  if (card.startDate !== nextCard.startDate) {
    activities.push({
      cardId,
      type: "card-start-date-updated",
      message: nextCard.startDate ? "Обновлена дата старта." : "Удалена дата старта.",
      createdAt: timestamp,
    });
  }

  if (card.status !== nextCard.status) {
    activities.push({
      cardId,
      type: "card-status-updated",
      message: `Статус изменён: ${describeStatus(card.status)} → ${describeStatus(nextCard.status)}.`,
      createdAt: timestamp,
    });
  }

  if (card.priority !== nextCard.priority) {
    activities.push({
      cardId,
      type: "card-priority-updated",
      message: `Приоритет изменён: ${describePriority(card.priority)} → ${describePriority(nextCard.priority)}.`,
      createdAt: timestamp,
    });
  }

  if (!areStringArraysEqual(card.labelIds, nextCard.labelIds)) {
    activities.push({
      cardId,
      type: "card-labels-updated",
      message: describeLabels(board, nextCard.labelIds),
      createdAt: timestamp,
    });
  }

  if (JSON.stringify(card.customFields) !== JSON.stringify(nextCard.customFields)) {
    activities.push({
      cardId,
      type: "card-custom-fields-updated",
      message: "Обновлены дополнительные поля карточки.",
      createdAt: timestamp,
    });
  }

  if (card.sticker !== nextCard.sticker) {
    activities.push({
      cardId,
      type: "card-sticker-updated",
      message: nextCard.sticker
        ? `Изменён стикер: ${nextCard.sticker}.`
        : "Удалён стикер карточки.",
      createdAt: timestamp,
    });
  }

  return appendBoardActivities(
    {
      ...board,
      cards: {
        ...board.cards,
        [cardId]: nextCard,
      },
      updatedAt: timestamp,
    },
    activities,
  );
}

export function deleteCard(board: Board, cardId: string): Board {
  if (!board.cards[cardId]) {
    return board;
  }

  return removeCardsFromBoard(board, new Set([cardId]));
}

export function moveCard(
  board: Board,
  cardId: string,
  destinationListId: string,
  destinationIndex: number,
): Board {
  const card = board.cards[cardId];
  const sourceList = card ? board.lists[card.listId] : undefined;
  const destinationList = board.lists[destinationListId];

  if (
    !card ||
    !sourceList ||
    !destinationList ||
    card.isArchived ||
    sourceList.isArchived ||
    destinationList.isArchived
  ) {
    return board;
  }

  const sourceIndex = sourceList.cardIds.indexOf(cardId);
  if (sourceIndex === -1) {
    return board;
  }

  if (
    sourceList.id !== destinationList.id &&
    destinationList.wipLimit &&
    destinationList.cardIds.length >= destinationList.wipLimit
  ) {
    return board;
  }

  const sourceCardIds = sourceList.cardIds.filter((id) => id !== cardId);
  const destinationBase = sourceList.id === destinationList.id ? sourceCardIds : destinationList.cardIds;
  const safeIndex = Math.max(0, Math.min(destinationIndex, destinationBase.length));
  const destinationCardIds = [...destinationBase];
  destinationCardIds.splice(safeIndex, 0, cardId);
  const timestamp = now();

  if (sourceList.id === destinationList.id) {
    return {
      ...board,
      lists: {
        ...board.lists,
        [sourceList.id]: {
          ...sourceList,
          cardIds: destinationCardIds,
          updatedAt: timestamp,
        },
      },
      updatedAt: timestamp,
    };
  }

  const nextBoard: Board = {
    ...board,
    lists: {
      ...board.lists,
      [sourceList.id]: {
        ...sourceList,
        cardIds: sourceCardIds,
        updatedAt: timestamp,
      },
      [destinationList.id]: {
        ...destinationList,
        cardIds: destinationCardIds,
        updatedAt: timestamp,
      },
    },
    cards: {
      ...board.cards,
      [cardId]: {
        ...card,
        listId: destinationList.id,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId,
      type: "card-moved",
      message: `Перемещено из «${summarize(sourceList.title)}» в «${summarize(destinationList.title)}».`,
      createdAt: timestamp,
    },
  ]);
}

export function moveList(board: Board, listId: string, destinationListId: string): Board {
  const sourceIndex = board.listIds.indexOf(listId);
  const destinationIndex = board.listIds.indexOf(destinationListId);

  if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) {
    return board;
  }

  return {
    ...board,
    listIds: moveItem(board.listIds, sourceIndex, destinationIndex),
    updatedAt: now(),
  };
}
