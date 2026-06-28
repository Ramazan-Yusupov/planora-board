import type { Board, BoardAttachment, BoardCard } from "@/entities/board";
import { createId } from "@/shared/lib";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export function createBoardAttachment(cardId: string, file: File): BoardAttachment {
  const timestamp = Date.now();

  return {
    id: createId("attachment"),
    cardId,
    name: file.name.trim() || "Без названия",
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function addAttachmentToCard(
  board: Board,
  attachment: BoardAttachment,
): Board {
  const card = board.cards[attachment.cardId];

  if (!card || board.attachments[attachment.id]) {
    return board;
  }

  const timestamp = Date.now();

  return {
    ...board,
    attachmentIds: [...board.attachmentIds, attachment.id],
    attachments: {
      ...board.attachments,
      [attachment.id]: attachment,
    },
    cards: {
      ...board.cards,
      [card.id]: {
        ...card,
        attachmentIds: [...card.attachmentIds, attachment.id],
        updatedAt: timestamp,
      },
    },
    updatedAt: timestamp,
  };
}

export function removeAttachmentFromCard(board: Board, attachmentId: string): Board {
  const attachment = board.attachments[attachmentId];
  const card = attachment ? board.cards[attachment.cardId] : undefined;

  if (!attachment || !card) {
    return board;
  }

  const attachments = { ...board.attachments };
  delete attachments[attachmentId];
  const timestamp = Date.now();
  const nextCard: BoardCard = {
    ...card,
    attachmentIds: card.attachmentIds.filter((id) => id !== attachmentId),
    cover:
      card.cover?.type === "attachment" && card.cover.attachmentId === attachmentId
        ? undefined
        : card.cover,
    updatedAt: timestamp,
  };

  return {
    ...board,
    attachmentIds: board.attachmentIds.filter((id) => id !== attachmentId),
    attachments,
    cards: {
      ...board.cards,
      [card.id]: nextCard,
    },
    updatedAt: timestamp,
  };
}
