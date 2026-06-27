import type { Board } from "../model/types";

const createdAt = 1_760_000_000_000;

export const STARTER_BOARD: Board = {
  id: "starter-board",
  title: "Мой проект",
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
      description: "В карточке доступны название, описание, срок и цветная метка.",
      label: "blue",
      createdAt,
      updatedAt: createdAt,
    },
    "card-brief": {
      id: "card-brief",
      listId: "list-ideas",
      title: "Добавьте новую задачу",
      description: "Нажмите кнопку «Добавить карточку» внизу списка.",
      label: "none",
      createdAt,
      updatedAt: createdAt,
    },
    "card-design": {
      id: "card-design",
      listId: "list-progress",
      title: "Перетащите карточку между колонками",
      description: "Можно менять порядок карточек внутри одной колонки или переносить их в другую.",
      label: "violet",
      createdAt,
      updatedAt: createdAt,
    },
  },
  createdAt,
  updatedAt: createdAt,
};
