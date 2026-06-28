import type { Board, BoardAttachment, BoardCard } from "../model/types";

export function getCardAttachments(
  board: Board,
  card: Pick<BoardCard, "attachmentIds">,
): BoardAttachment[] {
  return card.attachmentIds.flatMap((attachmentId) => {
    const attachment = board.attachments[attachmentId];
    return attachment ? [attachment] : [];
  });
}

export function isImageAttachment(attachment: Pick<BoardAttachment, "mimeType">): boolean {
  return attachment.mimeType.startsWith("image/");
}

export function formatAttachmentSize(size: number): string {
  if (size < 1024) {
    return `${size} Б`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} КБ`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}
