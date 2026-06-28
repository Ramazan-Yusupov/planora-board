import type { DndItemData } from "@/shared/lib";

export type ListMoveDestination = Readonly<{
  listId: string;
  destinationListId: string;
}>;

export function getListMoveDestination(
  activeData: DndItemData,
  overData: DndItemData,
): ListMoveDestination | null {
  if (
    activeData.type !== "list" ||
    !activeData.listId ||
    !overData.listId ||
    activeData.listId === overData.listId
  ) {
    return null;
  }

  return {
    listId: activeData.listId,
    destinationListId: overData.listId,
  };
}
