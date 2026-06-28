import {
  appendBoardActivities,
  normalizeBoardLabelColor,
  normalizeBoardLabelName,
  normalizeCardLabelIds,
  type Board,
  type BoardLabel,
  type BoardLabelDraft,
} from "@/entities/board";
import { createId } from "@/shared/lib";

function now(): number {
  return Date.now();
}

function isDuplicateName(
  board: Board,
  name: string,
  ignoredLabelId?: string,
): boolean {
  const normalizedName = name.toLocaleLowerCase("ru-RU");

  return board.labelIds.some((labelId) => {
    const label = board.labels[labelId];

    return (
      label !== undefined &&
      label.id !== ignoredLabelId &&
      label.name.toLocaleLowerCase("ru-RU") === normalizedName
    );
  });
}

export type CreateBoardLabelResult = Readonly<{
  board: Board;
  label: BoardLabel | null;
}>;

export function createBoardLabel(
  board: Board,
  draft: BoardLabelDraft,
): CreateBoardLabelResult {
  const name = normalizeBoardLabelName(draft.name);
  const color = normalizeBoardLabelColor(draft.color);

  if (!name || !color || isDuplicateName(board, name)) {
    return { board, label: null };
  }

  const timestamp = now();
  const label: BoardLabel = {
    id: createId("label"),
    name,
    color,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    board: {
      ...board,
      labelIds: [...board.labelIds, label.id],
      labels: {
        ...board.labels,
        [label.id]: label,
      },
      updatedAt: timestamp,
    },
    label,
  };
}

export function updateBoardLabel(
  board: Board,
  labelId: string,
  draft: BoardLabelDraft,
): Board {
  const label = board.labels[labelId];
  const name = normalizeBoardLabelName(draft.name);
  const color = normalizeBoardLabelColor(draft.color);

  if (!label || !name || !color || isDuplicateName(board, name, labelId)) {
    return board;
  }

  if (label.name === name && label.color === color) {
    return board;
  }

  const timestamp = now();
  const nextBoard: Board = {
    ...board,
    labels: {
      ...board.labels,
      [labelId]: {
        ...label,
        name,
        color,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
  const affectedCardIds = Object.values(board.cards)
    .filter((card) => card.labelIds.includes(labelId))
    .map((card) => card.id);

  return appendBoardActivities(
    nextBoard,
    affectedCardIds.map((cardId) => ({
      cardId,
      type: "card-labels-updated",
      message:
        label.name !== name
          ? `Переименована метка: «${label.name}» → «${name}».`
          : `Изменён цвет метки «${name}».`,
      createdAt: timestamp,
    })),
  );
}

export function deleteBoardLabel(board: Board, labelId: string): Board {
  const label = board.labels[labelId];

  if (!label) {
    return board;
  }

  const timestamp = now();
  const labels = { ...board.labels };
  delete labels[labelId];
  const affectedCardIds: string[] = [];

  const cards = Object.fromEntries(
    Object.entries(board.cards).map(([cardId, card]) => {
      if (!card.labelIds.includes(labelId)) {
        return [cardId, card];
      }

      affectedCardIds.push(cardId);
      return [
        cardId,
        {
          ...card,
          labelIds: normalizeCardLabelIds(
            card.labelIds.filter((currentLabelId) => currentLabelId !== labelId),
            labels,
          ),
          updatedAt: timestamp,
        },
      ];
    }),
  ) as Record<string, typeof board.cards[string]>;

  const nextBoard: Board = {
    ...board,
    labelIds: board.labelIds.filter((currentLabelId) => currentLabelId !== labelId),
    labels,
    cards,
    updatedAt: timestamp,
  };

  return appendBoardActivities(
    nextBoard,
    affectedCardIds.map((cardId) => ({
      cardId,
      type: "card-labels-updated",
      message: `Удалена метка «${label.name}».`,
      createdAt: timestamp,
    })),
  );
}
