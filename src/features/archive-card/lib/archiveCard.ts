import type { Board } from "@/entities/board";

function now(): number {
  return Date.now();
}

export function archiveCard(board: Board, cardId: string): Board {
  const card = board.cards[cardId];
  const list = card ? board.lists[card.listId] : undefined;

  if (!card || !list || card.isArchived) {
    return board;
  }

  const timestamp = now();

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
    cards: {
      ...board.cards,
      [card.id]: {
        ...card,
        isArchived: true,
        archivedAt: timestamp,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
}

export function restoreCard(board: Board, cardId: string): Board {
  const card = board.cards[cardId];
  const list = card ? board.lists[card.listId] : undefined;

  if (!card || !list || !card.isArchived) {
    return board;
  }

  const timestamp = now();
  const restoredCard = {
    ...card,
    isArchived: false,
    updatedAt: timestamp,
  };

  delete restoredCard.archivedAt;

  return {
    ...board,
    lists: {
      ...board.lists,
      [list.id]: {
        ...list,
        cardIds: [...list.cardIds, card.id],
        updatedAt: timestamp,
      },
    },
    cards: {
      ...board.cards,
      [card.id]: restoredCard,
    },
    updatedAt: timestamp,
  };
}
