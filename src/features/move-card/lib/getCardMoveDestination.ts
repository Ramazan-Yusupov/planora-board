import type { Board } from "@/entities/board";
import type { DndItemData } from "@/shared/lib";

export type CardMoveDestination = Readonly<{
  cardId: string;
  destinationListId: string;
  destinationIndex: number;
}>;

export function getCardMoveDestination(
  board: Board,
  activeData: DndItemData,
  overData: DndItemData,
): CardMoveDestination | null {
  if (
    activeData.type !== "card" ||
    !activeData.cardId ||
    !overData.listId
  ) {
    return null;
  }

  const targetList = board.lists[overData.listId];

  if (!targetList) {
    return null;
  }

  let destinationIndex = targetList.cardIds.length;

  if (overData.type === "card" && overData.cardId) {
    const cardIndex = targetList.cardIds.indexOf(overData.cardId);

    if (cardIndex >= 0) {
      destinationIndex = cardIndex;
    }
  }

  return {
    cardId: activeData.cardId,
    destinationListId: targetList.id,
    destinationIndex,
  };
}
