import { appendBoardActivities, type Board } from "@/entities/board";

function now(): number {
  return Date.now();
}

function summarize(value: string, maxLength = 72): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function archiveCard(board: Board, cardId: string): Board {
  const card = board.cards[cardId];
  const list = card ? board.lists[card.listId] : undefined;

  if (!card || !list || card.isArchived) {
    return board;
  }

  const timestamp = now();
  const nextBoard: Board = {
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

  return appendBoardActivities(nextBoard, [
    {
      cardId,
      type: "card-archived",
      message: "Карточка архивирована.",
      createdAt: timestamp,
    },
  ]);
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

  const nextBoard: Board = {
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

  return appendBoardActivities(nextBoard, [
    {
      cardId,
      type: "card-restored",
      message: `Карточка восстановлена в список «${summarize(list.title)}».`,
      createdAt: timestamp,
    },
  ]);
}
