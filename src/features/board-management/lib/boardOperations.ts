import {
  appendBoardActivities,
  formatActivityDueDate,
  getRandomCardSticker,
  normalizeCardLabelIds,
  normalizeCardSticker,
  removeCardActivities,
  removeCardChecklists,
  type Board,
  type BoardActivityInput,
  type BoardAppearance,
  type CardDraft,
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
  const nextCards = Object.fromEntries(
    Object.entries(board.cards).filter(([cardId]) => !cardIdsToDelete.has(cardId)),
  );
  const relatedChecklists = removeCardChecklists(
    board.checklists,
    board.checklistItems,
    cardIdsToDelete,
  );
  const relatedActivities = removeCardActivities(board, cardIdsToDelete);

  return {
    ...board,
    listIds: board.listIds.filter((id) => id !== listId),
    lists: remainingLists,
    cards: nextCards,
    checklistIds: board.checklistIds.filter(
      (checklistId) => Boolean(relatedChecklists.checklists[checklistId]),
    ),
    ...relatedChecklists,
    ...relatedActivities,
    updatedAt: now(),
  };
}

export function addCard(board: Board, listId: string, title: string): Board {
  const list = board.lists[listId];
  const normalizedTitle = title.trim();

  if (!list || !normalizedTitle) {
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
        labelIds: [],
        checklistIds: [],
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
  const nextCard = {
    ...card,
    title: normalizedTitle,
    description: draft.description.trim(),
    dueDate: draft.dueDate || undefined,
    labelIds: normalizeCardLabelIds(draft.labelIds, board.labels),
    sticker: normalizeCardSticker(draft.sticker),
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

  if (!areStringArraysEqual(card.labelIds, nextCard.labelIds)) {
    activities.push({
      cardId,
      type: "card-labels-updated",
      message: describeLabels(board, nextCard.labelIds),
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
  const card = board.cards[cardId];
  const list = card ? board.lists[card.listId] : undefined;

  if (!card || !list) {
    return board;
  }

  const remainingCards = { ...board.cards };
  delete remainingCards[cardId];
  const timestamp = now();
  const relatedChecklists = removeCardChecklists(
    board.checklists,
    board.checklistItems,
    new Set([cardId]),
  );
  const relatedActivities = removeCardActivities(board, new Set([cardId]));

  return {
    ...board,
    lists: {
      ...board.lists,
      [list.id]: {
        ...list,
        cardIds: list.cardIds.filter((id) => id !== cardId),
        updatedAt: timestamp,
      },
    },
    cards: remainingCards,
    checklistIds: board.checklistIds.filter(
      (checklistId) => Boolean(relatedChecklists.checklists[checklistId]),
    ),
    ...relatedChecklists,
    ...relatedActivities,
    updatedAt: timestamp,
  };
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

  if (!card || !sourceList || !destinationList || card.isArchived) {
    return board;
  }

  const sourceIndex = sourceList.cardIds.indexOf(cardId);
  if (sourceIndex === -1) {
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
