export const CALENDAR_ROUTE = "/calendar";
export const ANALYTICS_ROUTE = "/analytics";
export const DRAW_ROUTE = "/draw";
export const MY_WORK_ROUTE = "/my-work";
export const NOTES_ROUTE = "/notes";
export const TASK_REVIEW_ROUTE = "/task-review";

export function getBoardRoute(boardId: string, cardId?: string): string {
  const route = `/boards/${encodeURIComponent(boardId)}`;

  if (!cardId) {
    return route;
  }

  return `${route}?card=${encodeURIComponent(cardId)}`;
}
