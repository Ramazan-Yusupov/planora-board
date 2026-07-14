import {
  appendBoardActivities,
  type Board,
  type BoardComment,
} from "@/entities/board";
import { createId } from "@/shared/lib";

function now(): number {
  return Date.now();
}

export function addCardComment(
  board: Board,
  cardId: string,
  message: string,
): Board {
  const card = board.cards[cardId];
  const normalizedMessage = message.trim();

  if (!card || !normalizedMessage) {
    return board;
  }

  const timestamp = now();
  const comment: BoardComment = {
    id: createId("comment"),
    cardId,
    authorName: "Вы",
    message: normalizedMessage,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const nextBoard: Board = {
    ...board,
    commentIds: [comment.id, ...board.commentIds],
    comments: {
      ...board.comments,
      [comment.id]: comment,
    },
    cards: {
      ...board.cards,
      [cardId]: {
        ...card,
        commentIds: [comment.id, ...card.commentIds],
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId,
      type: "comment-created",
      message: "Добавлен комментарий.",
      createdAt: timestamp,
    },
  ]);
}

export function updateCardComment(
  board: Board,
  commentId: string,
  message: string,
): Board {
  const comment = board.comments[commentId];
  const normalizedMessage = message.trim();

  if (!comment || !normalizedMessage || comment.message === normalizedMessage) {
    return board;
  }

  const timestamp = now();
  const nextBoard: Board = {
    ...board,
    comments: {
      ...board.comments,
      [commentId]: {
        ...comment,
        message: normalizedMessage,
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: comment.cardId,
      type: "comment-updated",
      message: "Комментарий обновлён.",
      createdAt: timestamp,
    },
  ]);
}

export function deleteCardComment(board: Board, commentId: string): Board {
  const comment = board.comments[commentId];

  if (!comment) {
    return board;
  }

  const card = board.cards[comment.cardId];
  const timestamp = now();
  const comments = { ...board.comments };
  delete comments[commentId];
  const nextBoard: Board = {
    ...board,
    commentIds: board.commentIds.filter((currentCommentId) => currentCommentId !== commentId),
    comments,
    cards: card
      ? {
          ...board.cards,
          [card.id]: {
            ...card,
            commentIds: card.commentIds.filter((currentCommentId) => currentCommentId !== commentId),
            updatedAt: timestamp,
          },
        }
      : board.cards,
    updatedAt: timestamp,
  };

  return appendBoardActivities(nextBoard, [
    {
      cardId: comment.cardId,
      type: "comment-deleted",
      message: "Комментарий удалён.",
      createdAt: timestamp,
    },
  ]);
}
