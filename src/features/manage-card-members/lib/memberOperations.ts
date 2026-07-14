import {
  appendBoardActivities,
  type Board,
  type BoardCard,
  type BoardMember,
  type BoardMemberDraft,
} from "@/entities/board";
import { createId } from "@/shared/lib";

function now(): number {
  return Date.now();
}

export function createBoardMember(
  board: Board,
  draft: BoardMemberDraft,
): Readonly<{ board: Board; member: BoardMember | null }> {
  const normalizedName = draft.name.trim().replace(/\s+/g, " ");

  if (
    board.memberIds.length >= 10 ||
    !normalizedName ||
    !/^#[0-9a-fA-F]{6}$/.test(draft.avatarColor)
  ) {
    return { board, member: null };
  }

  const timestamp = now();
  const member: BoardMember = {
    id: createId("member"),
    name: normalizedName,
    avatarColor: draft.avatarColor,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    board: {
      ...board,
      memberIds: [...board.memberIds, member.id],
      members: {
        ...board.members,
        [member.id]: member,
      },
      updatedAt: timestamp,
    },
    member,
  };
}

export function updateBoardMember(
  board: Board,
  memberId: string,
  draft: BoardMemberDraft,
): Board {
  const member = board.members[memberId];
  const normalizedName = draft.name.trim().replace(/\s+/g, " ");

  if (!member || !normalizedName || !/^#[0-9a-fA-F]{6}$/.test(draft.avatarColor)) {
    return board;
  }

  const timestamp = now();

  return {
    ...board,
    members: {
      ...board.members,
      [memberId]: {
        ...member,
        name: normalizedName,
        avatarColor: draft.avatarColor,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
}

export function deleteBoardMember(board: Board, memberId: string): Board {
  if (!board.members[memberId]) {
    return board;
  }

  const timestamp = now();
  const members = { ...board.members };
  delete members[memberId];

  return {
    ...board,
    memberIds: board.memberIds.filter((currentMemberId) => currentMemberId !== memberId),
    members,
    cards: Object.fromEntries(
      Object.entries(board.cards).map(([cardId, card]) => [
        cardId,
        card.memberIds.includes(memberId)
          ? {
              ...card,
              memberIds: card.memberIds.filter((currentMemberId) => currentMemberId !== memberId),
              updatedAt: timestamp,
            }
          : card,
      ]),
    ) as Record<string, BoardCard>,
    updatedAt: timestamp,
  };
}

export function toggleCardMember(
  board: Board,
  cardId: string,
  memberId: string,
): Board {
  const card = board.cards[cardId];
  const member = board.members[memberId];

  if (!card || !member) {
    return board;
  }

  const timestamp = now();
  const isAssigned = card.memberIds.includes(memberId);
  const nextMemberIds = isAssigned
    ? card.memberIds.filter((currentMemberId) => currentMemberId !== memberId)
    : [...card.memberIds, memberId];
  const nextBoard: Board = {
    ...board,
    cards: {
      ...board.cards,
      [cardId]: {
        ...card,
        memberIds: nextMemberIds,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId,
      type: "card-members-updated",
      message: isAssigned
        ? `Участник «${member.name}» снят с карточки.`
        : `Участник «${member.name}» добавлен на карточку.`,
      createdAt: timestamp,
    },
  ]);
}
