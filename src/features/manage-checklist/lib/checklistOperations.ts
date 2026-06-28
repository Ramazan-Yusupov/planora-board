import type { Board } from "@/entities/board";
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

export function createChecklist(board: Board, cardId: string, title: string): Board {
  const card = board.cards[cardId];
  const normalizedTitle = normalizeTitle(title, DEFAULT_CHECKLIST_TITLE);

  if (!card || !normalizedTitle) {
    return board;
  }

  const timestamp = now();
  const checklistId = createId("checklist");

  return {
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

  const timestamp = now();

  return {
    ...board,
    checklists: {
      ...board.checklists,
      [checklistId]: {
        ...checklist,
        title: normalizedTitle.slice(0, 120),
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
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

  return {
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

  return {
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
}

export function renameChecklistItem(
  board: Board,
  itemId: string,
  title: string,
): Board {
  const item = board.checklistItems[itemId];
  const normalizedTitle = normalizeTitle(title);

  if (!item || !normalizedTitle) {
    return board;
  }

  const timestamp = now();

  return {
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
}

export function toggleChecklistItem(board: Board, itemId: string): Board {
  const item = board.checklistItems[itemId];
  const checklist = item ? board.checklists[item.checklistId] : undefined;

  if (!item || !checklist) {
    return board;
  }

  const timestamp = now();

  return {
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
        isCompleted: !item.isCompleted,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
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

  return {
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

  return {
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
}
