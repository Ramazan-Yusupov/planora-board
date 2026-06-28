import { createId } from "@/shared/lib";

import { DEFAULT_BOARD_APPEARANCE } from "./appearance";
import { createDefaultBoardLabelCollection } from "./labels";
import type { Board, BoardAppearance } from "../model/types";

type StarterBoardOptions = {
  id?: string;
  title?: string;
  appearance?: BoardAppearance;
  createdAt?: number;
};

function resolveAppearance(appearance?: BoardAppearance): BoardAppearance {
  return {
    ...DEFAULT_BOARD_APPEARANCE,
    ...appearance,
  };
}

export function createStarterBoard(options: StarterBoardOptions = {}): Board {
  const createdAt = options.createdAt ?? Date.now();
  const id = options.id ?? "starter-board";
  const title = options.title?.trim() || "Мой проект";
  const labels = createDefaultBoardLabelCollection(createdAt);

  return {
    id,
    title,
    appearance: resolveAppearance(options.appearance),
    ...labels,
    listIds: ["list-ideas", "list-progress", "list-done"],
    lists: {
      "list-ideas": {
        id: "list-ideas",
        title: "Идеи",
        cardIds: ["card-welcome", "card-brief"],
        createdAt,
        updatedAt: createdAt,
      },
      "list-progress": {
        id: "list-progress",
        title: "В работе",
        cardIds: ["card-design"],
        createdAt,
        updatedAt: createdAt,
      },
      "list-done": {
        id: "list-done",
        title: "Готово",
        cardIds: [],
        createdAt,
        updatedAt: createdAt,
      },
    },
    cards: {
      "card-welcome": {
        id: "card-welcome",
        listId: "list-ideas",
        title: "Откройте карточку и отредактируйте её",
        description: "В карточке доступны название, описание, срок и несколько цветных меток.",
        labelIds: ["label-idea"],
        sticker: "👋",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      "card-brief": {
        id: "card-brief",
        listId: "list-ideas",
        title: "Добавьте новую задачу",
        description: "Нажмите кнопку «Добавить карточку» внизу списка.",
        labelIds: [],
        sticker: "➕",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
      "card-design": {
        id: "card-design",
        listId: "list-progress",
        title: "Перетащите карточку между колонками",
        description: "Можно менять порядок карточек внутри одной колонки или переносить их в другую.",
        labelIds: ["label-progress"],
        sticker: "↔️",
        isArchived: false,
        createdAt,
        updatedAt: createdAt,
      },
    },
    createdAt,
    updatedAt: createdAt,
  };
}

export function createEmptyBoard(title: string): Board {
  const createdAt = Date.now();
  const listId = createId("list");
  const labels = createDefaultBoardLabelCollection(createdAt);

  return {
    id: createId("board"),
    title: title.trim() || "Новый проект",
    appearance: { ...DEFAULT_BOARD_APPEARANCE },
    ...labels,
    listIds: [listId],
    lists: {
      [listId]: {
        id: listId,
        title: "Новые задачи",
        cardIds: [],
        createdAt,
        updatedAt: createdAt,
      },
    },
    cards: {},
    createdAt,
    updatedAt: createdAt,
  };
}
