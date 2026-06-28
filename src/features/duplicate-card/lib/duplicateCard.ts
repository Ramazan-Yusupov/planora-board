import {
  appendBoardActivities,
  type Board,
  type BoardChecklist,
  type BoardChecklistItem,
} from "@/entities/board";
import { createId } from "@/shared/lib";

function now(): number {
  return Date.now();
}

function summarize(value: string, maxLength = 72): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function createDuplicateTitle(board: Board, sourceTitle: string): string {
  const existingTitles = new Set(
    Object.values(board.cards).map((card) => card.title.trim()),
  );
  const baseTitle = `${sourceTitle} (копия)`;

  if (!existingTitles.has(baseTitle)) {
    return baseTitle;
  }

  let copyNumber = 2;
  let nextTitle = `${sourceTitle} (копия ${copyNumber})`;

  while (existingTitles.has(nextTitle)) {
    copyNumber += 1;
    nextTitle = `${sourceTitle} (копия ${copyNumber})`;
  }

  return nextTitle;
}

function duplicateCardChecklists(
  board: Board,
  sourceCardId: string,
  duplicateCardId: string,
  timestamp: number,
): Readonly<{
  checklistIds: string[];
  checklists: Record<string, BoardChecklist>;
  checklistItems: Record<string, BoardChecklistItem>;
}> {
  const sourceCard = board.cards[sourceCardId];

  if (!sourceCard) {
    return { checklistIds: [], checklists: {}, checklistItems: {} };
  }

  const checklists: Record<string, BoardChecklist> = {};
  const checklistItems: Record<string, BoardChecklistItem> = {};
  const checklistIds: string[] = [];

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
      cardId: duplicateCardId,
      itemIds,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  return { checklistIds, checklists, checklistItems };
}

export function duplicateCard(board: Board, cardId: string): Board {
  const sourceCard = board.cards[cardId];
  const sourceList = sourceCard ? board.lists[sourceCard.listId] : undefined;

  if (!sourceCard || !sourceList || sourceCard.isArchived) {
    return board;
  }

  const sourceIndex = sourceList.cardIds.indexOf(sourceCard.id);

  if (sourceIndex === -1) {
    return board;
  }

  const timestamp = now();
  const duplicateId = createId("card");
  const duplicateTitle = createDuplicateTitle(board, sourceCard.title);
  const copiedChecklists = duplicateCardChecklists(
    board,
    sourceCard.id,
    duplicateId,
    timestamp,
  );
  const duplicate = {
    ...sourceCard,
    id: duplicateId,
    title: duplicateTitle,
    checklistIds: copiedChecklists.checklistIds,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  delete duplicate.archivedAt;

  const cardIds = [...sourceList.cardIds];
  cardIds.splice(sourceIndex + 1, 0, duplicateId);

  const nextBoard: Board = {
    ...board,
    checklistIds: [...board.checklistIds, ...copiedChecklists.checklistIds],
    checklists: {
      ...board.checklists,
      ...copiedChecklists.checklists,
    },
    checklistItems: {
      ...board.checklistItems,
      ...copiedChecklists.checklistItems,
    },
    lists: {
      ...board.lists,
      [sourceList.id]: {
        ...sourceList,
        cardIds,
        updatedAt: timestamp,
      },
    },
    cards: {
      ...board.cards,
      [duplicateId]: duplicate,
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: sourceCard.id,
      type: "card-duplicated",
      message: `Создана копия «${summarize(duplicateTitle)}».`,
      createdAt: timestamp,
    },
    {
      cardId: duplicateId,
      type: "card-created",
      message: `Карточка создана как копия «${summarize(sourceCard.title)}».`,
      createdAt: timestamp,
    },
  ]);
}
