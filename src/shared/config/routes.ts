export const CALENDAR_ROUTE = "/calendar";
export const ADMIN_ROUTE = "/admin";

export function getBoardRoute(boardId: string, cardId?: string): string {
  const route = `/boards/${encodeURIComponent(boardId)}`;

  if (!cardId) {
    return route;
  }

  return `${route}?card=${encodeURIComponent(cardId)}`;
}
