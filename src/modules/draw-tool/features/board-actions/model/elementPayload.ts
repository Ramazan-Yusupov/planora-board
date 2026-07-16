import { serializeScene } from "@/modules/draw-tool/entities/scene";
import { createId } from "@/modules/draw-tool/shared/lib";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

export function cloneElements(elements: BoardElement[]) {
  return JSON.parse(JSON.stringify(elements)) as BoardElement[];
}

export function normalizeInsertedElements(elements: BoardElement[], offset = 32) {
  const idMap = new Map<string, string>();

  elements.forEach((element) => {
    idMap.set(element.id, createId(element.type));
  });

  return elements.map((element) => ({
    ...element,
    id: idMap.get(element.id) ?? createId(element.type),
    x: element.x + offset,
    y: element.y + offset,
    groupId: element.groupId ? createId("group") : undefined,
    parentId: element.parentId ? idMap.get(element.parentId) : undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })) as BoardElement[];
}

export function encodeSharePayload(elements: BoardElement[]) {
  const json = JSON.stringify(serializeScene(elements));
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function decodeSharePayload(payload: string) {
  const binary = atob(payload);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

