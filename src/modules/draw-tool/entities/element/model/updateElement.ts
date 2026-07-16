import type { BoardElement } from "./types";

export function updateElement<T extends BoardElement>(
  element: T,
  patch: Partial<Omit<T, "id" | "type" | "createdAt">>,
): T {
  return {
    ...element,
    ...patch,
    updatedAt: Date.now(),
  };
}

