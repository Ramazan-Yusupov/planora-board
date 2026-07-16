import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { createId } from "@/modules/draw-tool/shared/lib";
import { cloneElements, normalizeInsertedElements } from "./elementPayload";
import { readLibrary, writeLibrary } from "./storage";

export function saveElementsToLibrary(
  elements: BoardElement[],
  name = "Компонент",
) {
  if (elements.length === 0) return false;

  const items = readLibrary();
  writeLibrary(
    [
      {
        id: createId("library"),
        name,
        elements: cloneElements(elements),
        createdAt: Date.now(),
      },
      ...items,
    ].slice(0, 24),
  );
  return true;
}

export function getClonedLibraryItems() {
  return readLibrary().map((item) => ({
    ...item,
    elements: cloneElements(item.elements),
  }));
}

export function getNormalizedLibraryItemElements(itemId: string) {
  const item = readLibrary().find((libraryItem) => libraryItem.id === itemId);
  return item ? normalizeInsertedElements(item.elements, 48) : null;
}

export function deleteLibraryItemById(itemId: string) {
  const items = readLibrary();
  const nextItems = items.filter((item) => item.id !== itemId);
  if (nextItems.length === items.length) return false;

  writeLibrary(nextItems);
  return true;
}

