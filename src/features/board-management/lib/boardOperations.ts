import type { Board, CardDraft } from "@/entities/board";
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

export function renameBoard(board: Board, title: string): Board {
  const normalizedTitle = title.trim();

  return {
    ...board,
    title: normalizedTitle || "Новая доска",
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
  const nextCards = { ...board.cards };

  for (const cardId of list.cardIds) {
    delete nextCards[cardId];
  }

  return {
    ...board,
    listIds: board.listIds.filter((id) => id !== listId),
    lists: remainingLists,
    cards: nextCards,
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

  return {
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
        label: "none",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
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
    label: draft.label,
    updatedAt: timestamp,
  };

  return {
    ...board,
    cards: {
      ...board.cards,
      [cardId]: nextCard,
    },
    updatedAt: timestamp,
  };
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

  if (!card || !sourceList || !destinationList) {
    return board;
  }

  const sourceIndex = sourceList.cardIds.indexOf(cardId);
  if (sourceIndex === -1) {
    return board;
  }

  const sourceCardIds = sourceList.cardIds.filter((id) => id !== cardId);
  const destinationBase =
    sourceList.id === destinationList.id ? sourceCardIds : destinationList.cardIds;
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

  return {
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
