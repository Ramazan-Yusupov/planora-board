import {
  createElement,
  updateElement,
  type AdvancedElement,
  type BoardElement,
} from "@/modules/draw-tool/entities/element";
import type { Point } from "@/modules/draw-tool/shared/types";

import type { PlanoraTaskItem } from "./types";

export type PlanoraTaskElement = AdvancedElement & {
  metadata: Record<string, string> & {
    cardId: string;
    planoraType: "task";
  };
};

function truncateCanvasText(value: string, maxLength: number) {
  const normalized = value.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
}

function getTaskBody(task: PlanoraTaskItem) {
  return [
    `${task.boardTitle} / ${task.listTitle}`,
    task.dueDate ? `Срок: ${task.dueDate}` : "Без срока",
    [task.statusLabel, task.priorityLabel].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .map((line) => truncateCanvasText(line, 34));
}

export function isPlanoraTaskElement(
  element: BoardElement,
): element is PlanoraTaskElement {
  return (
    element.type === "code" &&
    "kind" in element &&
    element.metadata?.planoraType === "task" &&
    typeof element.metadata.cardId === "string"
  );
}

export function getPlanoraTaskElementPatch(
  element: AdvancedElement,
  task: PlanoraTaskItem | undefined,
): Partial<AdvancedElement> | null {
  if (!task) {
    const nextMetadata = {
      ...element.metadata,
      syncState: "missing",
    };
    const nextBody = ["Связанная задача не найдена", "Проверьте Board"];

    if (
      element.metadata?.syncState === "missing" &&
      element.body.join("\n") === nextBody.join("\n")
    ) {
      return null;
    }

    return {
      body: nextBody,
      metadata: nextMetadata,
    };
  }

  const nextTitle = truncateCanvasText(task.title, 34);
  const nextBody = getTaskBody(task);
  const nextMetadata = {
    ...element.metadata,
    planoraType: "task",
    cardId: task.id,
    boardId: task.boardId,
    listId: task.listId,
    dueDate: task.dueDate ?? "",
    status: task.statusLabel ?? "",
    priority: task.priorityLabel ?? "",
    syncState: "active",
  };
  if (
    element.title === nextTitle &&
    element.body.join("\n") === nextBody.join("\n") &&
    JSON.stringify(element.metadata ?? {}) === JSON.stringify(nextMetadata)
  ) {
    return null;
  }

  return {
    body: nextBody,
    metadata: nextMetadata,
    tags: ["planora-task", task.boardTitle, task.listTitle],
    title: nextTitle,
  };
}

export function createPlanoraTaskElement(task: PlanoraTaskItem, point: Point) {
  const element = createElement("advanced", {
    x: point.x,
    y: point.y,
    width: 340,
    height: 150,
    kind: "org-card",
    title: truncateCanvasText(task.title, 34),
    body: getTaskBody(task),
    style: {
      strokeColor: "#93c5fd",
      backgroundColor: "#111827",
      fillStyle: "solid",
      cornerStyle: "rounded",
      strokeWidth: 3,
    },
  });

  return updateElement(element, {
    metadata: {
      planoraType: "task",
      cardId: task.id,
      boardId: task.boardId,
      listId: task.listId,
      dueDate: task.dueDate ?? "",
      status: task.statusLabel ?? "",
      priority: task.priorityLabel ?? "",
      syncState: "active",
    },
    tags: ["planora-task", task.boardTitle, task.listTitle],
  });
}
