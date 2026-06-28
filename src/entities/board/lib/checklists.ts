import type {
  BoardCard,
  BoardChecklist,
  BoardChecklistItem,
} from "../model/types";

export type CardChecklistProgress = Readonly<{
  completed: number;
  total: number;
}>;

export function getCardChecklists(
  card: Pick<BoardCard, "checklistIds">,
  checklists: Readonly<Record<string, BoardChecklist>>,
): BoardChecklist[] {
  return card.checklistIds.flatMap((checklistId) => {
    const checklist = checklists[checklistId];

    return checklist ? [checklist] : [];
  });
}

export function getChecklistItems(
  checklist: Pick<BoardChecklist, "itemIds">,
  checklistItems: Readonly<Record<string, BoardChecklistItem>>,
): BoardChecklistItem[] {
  return checklist.itemIds.flatMap((itemId) => {
    const item = checklistItems[itemId];

    return item ? [item] : [];
  });
}

export function getCardChecklistProgress(
  card: Pick<BoardCard, "checklistIds">,
  checklists: Readonly<Record<string, BoardChecklist>>,
  checklistItems: Readonly<Record<string, BoardChecklistItem>>,
): CardChecklistProgress {
  let total = 0;
  let completed = 0;

  for (const checklist of getCardChecklists(card, checklists)) {
    for (const item of getChecklistItems(checklist, checklistItems)) {
      total += 1;

      if (item.isCompleted) {
        completed += 1;
      }
    }
  }

  return { completed, total };
}

export function removeCardChecklists(
  checklists: Readonly<Record<string, BoardChecklist>>,
  checklistItems: Readonly<Record<string, BoardChecklistItem>>,
  cardIds: ReadonlySet<string>,
): Readonly<{
  checklists: Record<string, BoardChecklist>;
  checklistItems: Record<string, BoardChecklistItem>;
}> {
  const nextChecklists: Record<string, BoardChecklist> = {};
  const removedChecklistIds = new Set<string>();

  for (const [checklistId, checklist] of Object.entries(checklists)) {
    if (cardIds.has(checklist.cardId)) {
      removedChecklistIds.add(checklistId);
      continue;
    }

    nextChecklists[checklistId] = checklist;
  }

  const nextChecklistItems = Object.fromEntries(
    Object.entries(checklistItems).filter(
      ([, item]) => !removedChecklistIds.has(item.checklistId),
    ),
  ) as Record<string, BoardChecklistItem>;

  return {
    checklists: nextChecklists,
    checklistItems: nextChecklistItems,
  };
}
