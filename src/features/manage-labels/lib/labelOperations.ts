import {
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

  return {
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
}

export function deleteBoardLabel(board: Board, labelId: string): Board {
  if (!board.labels[labelId]) {
    return board;
  }

  const timestamp = now();
  const labels = { ...board.labels };
  delete labels[labelId];

  const cards = Object.fromEntries(
    Object.entries(board.cards).map(([cardId, card]) => {
      if (!card.labelIds.includes(labelId)) {
        return [cardId, card];
      }

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
  );

  return {
    ...board,
    labelIds: board.labelIds.filter((currentLabelId) => currentLabelId !== labelId),
    labels,
    cards,
    updatedAt: timestamp,
  };
}
