import { createId } from "@/shared/lib";

import type { Board, BoardActivity, BoardActivityType } from "../model/types";

export const MAX_BOARD_ACTIVITIES = 500;

export type BoardActivityInput = Readonly<{
  cardId: string;
  type: BoardActivityType;
  message: string;
  createdAt?: number;
}>;

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function ensureActivityOrder(
  activityIds: readonly string[],
  activities: Readonly<Record<string, BoardActivity>>,
): string[] {
  const uniqueIds = new Set<string>();

  return activityIds.filter((activityId) => {
    if (uniqueIds.has(activityId) || !activities[activityId]) {
      return false;
    }

    uniqueIds.add(activityId);
    return true;
  });
}

export function appendBoardActivities(
  board: Board,
  inputs: readonly BoardActivityInput[],
): Board {
  if (inputs.length === 0) {
    return board;
  }

  const nextActivities: Record<string, BoardActivity> = { ...board.activities };
  const appendedIds: string[] = [];

  for (const input of inputs) {
    const activity: BoardActivity = {
      id: createId("activity"),
      actorName: "Вы",
      cardId: input.cardId,
      type: input.type,
      message: input.message,
      createdAt: input.createdAt ?? Date.now(),
    };

    nextActivities[activity.id] = activity;
    appendedIds.push(activity.id);
  }

  const nextActivityIds = ensureActivityOrder(
    [...appendedIds.reverse(), ...board.activityIds],
    nextActivities,
  ).slice(0, MAX_BOARD_ACTIVITIES);
  const retainedActivities = Object.fromEntries(
    nextActivityIds.map((activityId) => [activityId, nextActivities[activityId]]),
  ) as Record<string, BoardActivity>;

  return {
    ...board,
    activityIds: nextActivityIds,
    activities: retainedActivities,
  };
}

export function removeCardActivities(
  board: Board,
  cardIds: ReadonlySet<string>,
): Pick<Board, "activityIds" | "activities"> {
  if (cardIds.size === 0) {
    return {
      activityIds: board.activityIds,
      activities: board.activities,
    };
  }

  const activityIds = board.activityIds.filter((activityId) => {
    const activity = board.activities[activityId];
    return activity ? !cardIds.has(activity.cardId) : false;
  });
  const activities = Object.fromEntries(
    activityIds.flatMap((activityId) => {
      const activity = board.activities[activityId];
      return activity ? [[activityId, activity]] : [];
    }),
  ) as Record<string, BoardActivity>;

  return { activityIds, activities };
}

export function getCardActivities(
  board: Board,
  cardId: string,
): BoardActivity[] {
  return board.activityIds.flatMap((activityId) => {
    const activity = board.activities[activityId];

    return activity && activity.cardId === cardId ? [activity] : [];
  });
}

export function formatActivityDueDate(value: string): string {
  return formatDueDate(value);
}
