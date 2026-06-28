import { appendBoardActivities, type Board } from "@/entities/board";
import { createId } from "@/shared/lib";

const DEFAULT_CHECKLIST_TITLE = "Новый чек-лист";

function now(): number {
  return Date.now();
}

function normalizeTitle(value: string, fallback?: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized) {
    return normalized.slice(0, 320);
  }

  return fallback ?? null;
}

function summarize(value: string, maxLength = 72): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function createChecklist(board: Board, cardId: string, title: string): Board {
  const card = board.cards[cardId];
  const normalizedTitle = normalizeTitle(title, DEFAULT_CHECKLIST_TITLE);

  if (!card || !normalizedTitle) {
    return board;
  }

  const timestamp = now();
  const checklistId = createId("checklist");
  const nextBoard: Board = {
    ...board,
    checklistIds: [...board.checklistIds, checklistId],
    checklists: {
      ...board.checklists,
      [checklistId]: {
        id: checklistId,
        cardId,
        title: normalizedTitle.slice(0, 120),
        itemIds: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    cards: {
      ...board.cards,
      [cardId]: {
        ...card,
        checklistIds: [...card.checklistIds, checklistId],
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId,
      type: "checklist-created",
      message: `Добавлен чек-лист «${summarize(normalizedTitle.slice(0, 120))}».`,
      createdAt: timestamp,
    },
  ]);
}

export function renameChecklist(
  board: Board,
  checklistId: string,
  title: string,
): Board {
  const checklist = board.checklists[checklistId];
  const normalizedTitle = normalizeTitle(title);

  if (!checklist || !normalizedTitle) {
    return board;
  }

  const nextTitle = normalizedTitle.slice(0, 120);

  if (checklist.title === nextTitle) {
    return board;
  }

  const timestamp = now();
  const nextBoard: Board = {
    ...board,
    checklists: {
      ...board.checklists,
      [checklistId]: {
        ...checklist,
        title: nextTitle,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: checklist.cardId,
      type: "checklist-renamed",
      message: `Переименован чек-лист: «${summarize(checklist.title)}» → «${summarize(nextTitle)}».`,
      createdAt: timestamp,
    },
  ]);
}

export function deleteChecklist(board: Board, checklistId: string): Board {
  const checklist = board.checklists[checklistId];
  const card = checklist ? board.cards[checklist.cardId] : undefined;

  if (!checklist || !card) {
    return board;
  }

  const timestamp = now();
  const nextChecklists = { ...board.checklists };
  delete nextChecklists[checklistId];

  const nextChecklistItems = { ...board.checklistItems };
  for (const itemId of checklist.itemIds) {
    delete nextChecklistItems[itemId];
  }

  const nextBoard: Board = {
    ...board,
    checklistIds: board.checklistIds.filter((id) => id !== checklistId),
    checklists: nextChecklists,
    checklistItems: nextChecklistItems,
    cards: {
      ...board.cards,
      [card.id]: {
        ...card,
        checklistIds: card.checklistIds.filter((id) => id !== checklistId),
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: card.id,
      type: "checklist-deleted",
      message: `Удалён чек-лист «${summarize(checklist.title)}».`,
      createdAt: timestamp,
    },
  ]);
}

export function createChecklistItem(
  board: Board,
  checklistId: string,
  title: string,
): Board {
  const checklist = board.checklists[checklistId];
  const normalizedTitle = normalizeTitle(title);

  if (!checklist || !normalizedTitle) {
    return board;
  }

  const timestamp = now();
  const itemId = createId("checklist-item");
  const nextBoard: Board = {
    ...board,
    checklists: {
      ...board.checklists,
      [checklistId]: {
        ...checklist,
        itemIds: [...checklist.itemIds, itemId],
        updatedAt: timestamp,
      },
    },
    checklistItems: {
      ...board.checklistItems,
      [itemId]: {
        id: itemId,
        checklistId,
        title: normalizedTitle,
        isCompleted: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: checklist.cardId,
      type: "checklist-item-created",
      message: `Добавлен пункт «${summarize(normalizedTitle)}» в чек-лист «${summarize(checklist.title)}».`,
      createdAt: timestamp,
    },
  ]);
}

export function renameChecklistItem(
  board: Board,
  itemId: string,
  title: string,
): Board {
  const item = board.checklistItems[itemId];
  const checklist = item ? board.checklists[item.checklistId] : undefined;
  const normalizedTitle = normalizeTitle(title);

  if (!item || !checklist || !normalizedTitle) {
    return board;
  }

  if (item.title === normalizedTitle) {
    return board;
  }

  const timestamp = now();
  const nextBoard: Board = {
    ...board,
    checklistItems: {
      ...board.checklistItems,
      [itemId]: {
        ...item,
        title: normalizedTitle,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: checklist.cardId,
      type: "checklist-item-renamed",
      message: `Переименован пункт: «${summarize(item.title)}» → «${summarize(normalizedTitle)}».`,
      createdAt: timestamp,
    },
  ]);
}

export function toggleChecklistItem(board: Board, itemId: string): Board {
  const item = board.checklistItems[itemId];
  const checklist = item ? board.checklists[item.checklistId] : undefined;

  if (!item || !checklist) {
    return board;
  }

  const timestamp = now();
  const isCompleted = !item.isCompleted;
  const nextBoard: Board = {
    ...board,
    checklists: {
      ...board.checklists,
      [checklist.id]: {
        ...checklist,
        updatedAt: timestamp,
      },
    },
    checklistItems: {
      ...board.checklistItems,
      [itemId]: {
        ...item,
        isCompleted,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: checklist.cardId,
      type: "checklist-item-toggled",
      message: isCompleted
        ? `Выполнен пункт «${summarize(item.title)}».`
        : `Снята отметка с пункта «${summarize(item.title)}».`,
      createdAt: timestamp,
    },
  ]);
}

export function deleteChecklistItem(board: Board, itemId: string): Board {
  const item = board.checklistItems[itemId];
  const checklist = item ? board.checklists[item.checklistId] : undefined;

  if (!item || !checklist) {
    return board;
  }

  const timestamp = now();
  const nextChecklistItems = { ...board.checklistItems };
  delete nextChecklistItems[itemId];
  const nextBoard: Board = {
    ...board,
    checklists: {
      ...board.checklists,
      [checklist.id]: {
        ...checklist,
        itemIds: checklist.itemIds.filter((id) => id !== itemId),
        updatedAt: timestamp,
      },
    },
    checklistItems: nextChecklistItems,
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: checklist.cardId,
      type: "checklist-item-deleted",
      message: `Удалён пункт «${summarize(item.title)}».`,
      createdAt: timestamp,
    },
  ]);
}

export function moveChecklistItem(
  board: Board,
  itemId: string,
  destinationIndex: number,
): Board {
  const item = board.checklistItems[itemId];
  const checklist = item ? board.checklists[item.checklistId] : undefined;

  if (!item || !checklist) {
    return board;
  }

  const sourceIndex = checklist.itemIds.indexOf(itemId);

  if (sourceIndex === -1) {
    return board;
  }

  const safeIndex = Math.max(
    0,
    Math.min(destinationIndex, checklist.itemIds.length - 1),
  );

  if (sourceIndex === safeIndex) {
    return board;
  }

  const itemIds = [...checklist.itemIds];
  itemIds.splice(sourceIndex, 1);
  itemIds.splice(safeIndex, 0, itemId);
  const timestamp = now();
  const nextBoard: Board = {
    ...board,
    checklists: {
      ...board.checklists,
      [checklist.id]: {
        ...checklist,
        itemIds,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: checklist.cardId,
      type: "checklist-item-moved",
      message: `Изменён порядок пункта «${summarize(item.title)}».`,
      createdAt: timestamp,
    },
  ]);
}
