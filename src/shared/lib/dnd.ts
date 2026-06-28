export type DndItemData = Readonly<{
  type?: string;
  listId?: string;
  cardId?: string;
}>;

export function readDndItemData(value: unknown): DndItemData {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;

  return {
    type: typeof record.type === "string" ? record.type : undefined,
    listId: typeof record.listId === "string" ? record.listId : undefined,
    cardId: typeof record.cardId === "string" ? record.cardId : undefined,
  };
}
