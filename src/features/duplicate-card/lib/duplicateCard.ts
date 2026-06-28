import type { Board } from "@/entities/board";
import { createId } from "@/shared/lib";

function now(): number {
  return Date.now();
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
  const duplicateCard = {
    ...sourceCard,
    id: duplicateId,
    title: duplicateTitle,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  delete duplicateCard.archivedAt;

  const cardIds = [...sourceList.cardIds];
  cardIds.splice(sourceIndex + 1, 0, duplicateId);

  return {
    ...board,
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
      [duplicateId]: duplicateCard,
    },
    updatedAt: timestamp,
  };
}
