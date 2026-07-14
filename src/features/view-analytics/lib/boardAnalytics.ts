import {
  CARD_PRIORITY_OPTIONS,
  CARD_STATUS_OPTIONS,
  type Board,
  type BoardCard,
} from "@/entities/board";

export type AnalyticsSegment = Readonly<{
  id: string;
  label: string;
  value: number;
  color: string;
}>;

export type ListAnalyticsSegment = AnalyticsSegment &
  Readonly<{
    completed: number;
    total: number;
  }>;

export type BoardAnalytics = Readonly<{
  totalCards: number;
  activeCards: number;
  completedCards: number;
  blockedCards: number;
  overdueCards: number;
  dueSoonCards: number;
  completionPercent: number;
  statusSegments: AnalyticsSegment[];
  prioritySegments: AnalyticsSegment[];
  listSegments: ListAnalyticsSegment[];
}>;

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function isActiveCard(card: BoardCard): boolean {
  return !card.isArchived;
}

export function buildBoardAnalytics(
  board: Board,
  referenceDate = new Date(),
): BoardAnalytics {
  const todayKey = getDateKey(referenceDate);
  const nextWeekKey = getDateKey(addDays(referenceDate, 7));
  const activeCards = Object.values(board.cards).filter(isActiveCard);
  const completedCards = activeCards.filter((card) => card.status === "done").length;
  const blockedCards = activeCards.filter((card) => card.status === "blocked").length;
  const overdueCards = activeCards.filter(
    (card) => card.status !== "done" && card.dueDate && card.dueDate < todayKey,
  ).length;
  const dueSoonCards = activeCards.filter(
    (card) =>
      card.status !== "done" &&
      card.dueDate &&
      card.dueDate >= todayKey &&
      card.dueDate <= nextWeekKey,
  ).length;

  return {
    totalCards: Object.keys(board.cards).length,
    activeCards: activeCards.length,
    completedCards,
    blockedCards,
    overdueCards,
    dueSoonCards,
    completionPercent: activeCards.length
      ? Math.round((completedCards / activeCards.length) * 100)
      : 0,
    statusSegments: [
      ...CARD_STATUS_OPTIONS.map((option) => ({
        id: option.value,
        label: board.cardStatusLabels[option.value] ?? option.label,
        value: activeCards.filter((card) => card.status === option.value).length,
        color: option.color,
      })),
      ...board.cardStatuses.map((option) => ({
        id: option.id,
        label: option.name,
        value: activeCards.filter((card) => card.status === option.id).length,
        color: option.color,
      })),
    ],
    prioritySegments: [
      ...CARD_PRIORITY_OPTIONS.map((option) => ({
        id: option.value,
        label: board.cardPriorityLabels[option.value] ?? option.label,
        value: activeCards.filter((card) => card.priority === option.value).length,
        color: option.color,
      })),
      ...board.cardPriorities.map((option) => ({
        id: option.id,
        label: option.name,
        value: activeCards.filter((card) => card.priority === option.id).length,
        color: option.color,
      })),
    ],
    listSegments: board.listIds.flatMap((listId) => {
      const list = board.lists[listId];

      if (!list || list.isArchived) {
        return [];
      }

      const cards = list.cardIds.flatMap((cardId) => {
        const card = board.cards[cardId];
        return card && isActiveCard(card) ? [card] : [];
      });

      return [
        {
          id: list.id,
          label: list.title,
          value: cards.length,
          completed: cards.filter((card) => card.status === "done").length,
          total: cards.length,
          color: "#38bdf8",
        },
      ];
    }),
  };
}
