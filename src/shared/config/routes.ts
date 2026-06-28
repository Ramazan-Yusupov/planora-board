export const CALENDAR_ROUTE = "/calendar";

export function getBoardRoute(boardId: string, cardId?: string): string {
  const route = `/boards/${encodeURIComponent(boardId)}`;

  if (!cardId) {
    return route;
  }

  return `${route}?card=${encodeURIComponent(cardId)}`;
}
