import type { Board, BoardCard, BoardList, BoardWorkspace } from "@/entities/board";

export type TaskReviewTone = "danger" | "warning" | "info" | "muted";

export type TaskReviewItem = Readonly<{
  id: string;
  boardId: string;
  boardTitle: string;
  cardId: string;
  cardTitle: string;
  listTitle: string;
  dueDate?: string;
  priority: string;
  status: string;
  updatedAt: number;
}>;

export type TaskReviewSection = Readonly<{
  id: "overdue" | "blocked" | "noDueDate" | "noPriority" | "stale";
  title: string;
  description: string;
  emptyText: string;
  items: TaskReviewItem[];
  tone: TaskReviewTone;
}>;

export type TaskReviewBoardSummary = Readonly<{
  id: string;
  title: string;
  activeCards: number;
  blockedCards: number;
  noDueDateCards: number;
  overdueCards: number;
  staleCards: number;
  overloadedLists: number;
}>;

export type TaskReviewReport = Readonly<{
  activeCards: number;
  blockedCards: number;
  boards: TaskReviewBoardSummary[];
  checkedAt: number;
  noDueDateCards: number;
  noPriorityCards: number;
  overdueCards: number;
  sections: TaskReviewSection[];
  staleCards: number;
}>;

type ActiveTask = Readonly<{
  board: Board;
  card: BoardCard;
  list: BoardList;
}>;

const STALE_TASK_DAYS = 14;

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getActiveTasks(workspace: BoardWorkspace): ActiveTask[] {
  return workspace.boards.flatMap((board) =>
    board.listIds.flatMap((listId) => {
      const list = board.lists[listId];

      if (!list || list.isArchived) {
        return [];
      }

      return list.cardIds.flatMap((cardId) => {
        const card = board.cards[cardId];

        if (!card || card.isArchived || card.status === "done") {
          return [];
        }

        return [{ board, card, list }];
      });
    }),
  );
}

function toReviewItem({ board, card, list }: ActiveTask): TaskReviewItem {
  return {
    id: `${board.id}:${card.id}`,
    boardId: board.id,
    boardTitle: board.title,
    cardId: card.id,
    cardTitle: card.title,
    dueDate: card.dueDate,
    listTitle: list.title,
    priority: card.priority,
    status: card.status,
    updatedAt: card.updatedAt,
  };
}

function sortTasksByRisk(left: ActiveTask, right: ActiveTask): number {
  const leftDueDate = left.card.dueDate ?? "9999-12-31";
  const rightDueDate = right.card.dueDate ?? "9999-12-31";

  if (leftDueDate !== rightDueDate) {
    return leftDueDate.localeCompare(rightDueDate);
  }

  return right.card.updatedAt - left.card.updatedAt;
}

function countOverloadedLists(board: Board): number {
  return board.listIds.reduce((count, listId) => {
    const list = board.lists[listId];

    if (!list || list.isArchived || !list.wipLimit) {
      return count;
    }

    const activeCards = list.cardIds.filter((cardId) => {
      const card = board.cards[cardId];

      return card && !card.isArchived && card.status !== "done";
    }).length;

    return activeCards > list.wipLimit ? count + 1 : count;
  }, 0);
}

function buildBoardSummaries(
  workspace: BoardWorkspace,
  todayKey: string,
  staleTimestamp: number,
): TaskReviewBoardSummary[] {
  return workspace.boards.map((board) => {
    const tasks = getActiveTasks({ activeBoardId: board.id, boards: [board] });

    return {
      id: board.id,
      title: board.title,
      activeCards: tasks.length,
      blockedCards: tasks.filter(({ card }) => card.status === "blocked").length,
      noDueDateCards: tasks.filter(({ card }) => !card.dueDate).length,
      overdueCards: tasks.filter(
        ({ card }) => Boolean(card.dueDate && card.dueDate < todayKey),
      ).length,
      staleCards: tasks.filter(({ card }) => card.updatedAt < staleTimestamp).length,
      overloadedLists: countOverloadedLists(board),
    };
  });
}

export function buildTaskReviewReport(
  workspace: BoardWorkspace,
  now = new Date(),
): TaskReviewReport {
  const todayKey = getDateKey(now);
  const staleTimestamp = now.getTime() - STALE_TASK_DAYS * 24 * 60 * 60 * 1000;
  const activeTasks = getActiveTasks(workspace).sort(sortTasksByRisk);
  const overdueTasks = activeTasks.filter(
    ({ card }) => Boolean(card.dueDate && card.dueDate < todayKey),
  );
  const blockedTasks = activeTasks.filter(({ card }) => card.status === "blocked");
  const noDueDateTasks = activeTasks.filter(({ card }) => !card.dueDate);
  const noPriorityTasks = activeTasks.filter(({ card }) => card.priority === "none");
  const staleTasks = activeTasks.filter(({ card }) => card.updatedAt < staleTimestamp);
  const sections: TaskReviewSection[] = [
    {
      id: "overdue",
      title: "Просроченные",
      description: "Активные карточки со сроком в прошлом.",
      emptyText: "Просроченных задач нет.",
      items: overdueTasks.map(toReviewItem),
      tone: "danger",
    },
    {
      id: "blocked",
      title: "Заблокированные",
      description: "Задачи со статусом blocked, которые могут тормозить поток.",
      emptyText: "Заблокированных задач нет.",
      items: blockedTasks.map(toReviewItem),
      tone: "warning",
    },
    {
      id: "noDueDate",
      title: "Без срока",
      description: "Активные карточки без дедлайна, которые легко потерять.",
      emptyText: "У активных задач указан срок.",
      items: noDueDateTasks.map(toReviewItem),
      tone: "info",
    },
    {
      id: "noPriority",
      title: "Без приоритета",
      description: "Карточки без приоритета усложняют выбор следующего шага.",
      emptyText: "У активных задач есть приоритет.",
      items: noPriorityTasks.map(toReviewItem),
      tone: "muted",
    },
    {
      id: "stale",
      title: "Давно не обновлялись",
      description: `Активные задачи без изменений больше ${STALE_TASK_DAYS} дней.`,
      emptyText: "Застоявшихся задач нет.",
      items: staleTasks.map(toReviewItem),
      tone: "warning",
    },
  ];

  return {
    activeCards: activeTasks.length,
    blockedCards: blockedTasks.length,
    boards: buildBoardSummaries(workspace, todayKey, staleTimestamp),
    checkedAt: now.getTime(),
    noDueDateCards: noDueDateTasks.length,
    noPriorityCards: noPriorityTasks.length,
    overdueCards: overdueTasks.length,
    sections,
    staleCards: staleTasks.length,
  };
}

export function getTaskReviewIssueCount(report: TaskReviewReport): number {
  return report.sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
}
