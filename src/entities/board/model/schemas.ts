import { z } from "zod";

const boardBackgroundValues = [
  "midnight",
  "ocean",
  "violet",
  "forest",
  "ember",
  "custom",
] as const;
const cardColorValues = [
  "slate",
  "navy",
  "plum",
  "sand",
  "frost",
  "custom",
] as const;

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Ожидается цвет в формате #RRGGBB.");

const boardAppearanceSchema = z.object({
  background: z.enum(boardBackgroundValues),
  customBackgroundColor: hexColorSchema.optional(),
  cardColor: z.enum(cardColorValues),
  customCardColor: hexColorSchema.optional(),
});

const boardLabelSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(48),
  color: hexColorSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardCardSchema = z.object({
  id: z.string().min(1),
  listId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  dueDate: z.string().optional(),
  labelIds: z.array(z.string().min(1)).default([]),
  // Стикер добавлен после первой версии доски, поэтому старые записи
  // продолжают быть валидными без принудительной миграции.
  sticker: z.string().trim().min(1).max(32).optional(),
  // Старые записи IndexedDB не содержат этого поля. Zod добавит false
  // во время чтения, а следующая запись сохранит уже актуальную форму.
  isArchived: z.boolean().default(false),
  archivedAt: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardListSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  cardIds: z.array(z.string().min(1)),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const boardSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    appearance: boardAppearanceSchema,
    labelIds: z.array(z.string().min(1)),
    labels: z.record(z.string(), boardLabelSchema),
    listIds: z.array(z.string().min(1)),
    lists: z.record(z.string(), boardListSchema),
    cards: z.record(z.string(), boardCardSchema),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .superRefine((board, context) => {
    const boardLabelIds = new Set<string>();
    const boardListIds = new Set<string>();
    const cardOwners = new Map<string, string>();

    board.labelIds.forEach((labelId, index) => {
      if (boardLabelIds.has(labelId)) {
        context.addIssue({
          code: "custom",
          path: ["labelIds", index],
          message: "Метка не должна повторяться в порядке проекта.",
        });
      }

      boardLabelIds.add(labelId);

      if (!board.labels[labelId]) {
        context.addIssue({
          code: "custom",
          path: ["labelIds", index],
          message: "Ссылка на метку не найдена.",
        });
      }
    });

    for (const [labelKey, label] of Object.entries(board.labels)) {
      if (label.id !== labelKey) {
        context.addIssue({
          code: "custom",
          path: ["labels", labelKey, "id"],
          message: "Ключ метки должен совпадать с её id.",
        });
      }

      if (!boardLabelIds.has(labelKey)) {
        context.addIssue({
          code: "custom",
          path: ["labels", labelKey],
          message: "Метка отсутствует в порядке проекта.",
        });
      }
    }

    board.listIds.forEach((listId, index) => {
      if (boardListIds.has(listId)) {
        context.addIssue({
          code: "custom",
          path: ["listIds", index],
          message: "Список не должен повторяться в порядке доски.",
        });
      }

      boardListIds.add(listId);

      if (!board.lists[listId]) {
        context.addIssue({
          code: "custom",
          path: ["listIds", index],
          message: "Ссылка на список не найдена.",
        });
      }
    });

    for (const [listKey, list] of Object.entries(board.lists)) {
      if (list.id !== listKey) {
        context.addIssue({
          code: "custom",
          path: ["lists", listKey, "id"],
          message: "Ключ списка должен совпадать с его id.",
        });
      }

      if (!boardListIds.has(listKey)) {
        context.addIssue({
          code: "custom",
          path: ["lists", listKey],
          message: "Список отсутствует в порядке доски.",
        });
      }

      list.cardIds.forEach((cardId, index) => {
        const card = board.cards[cardId];
        const owner = cardOwners.get(cardId);

        if (owner) {
          context.addIssue({
            code: "custom",
            path: ["lists", listKey, "cardIds", index],
            message: "Карточка не может входить в несколько списков.",
          });
        }

        cardOwners.set(cardId, listKey);

        if (!card) {
          context.addIssue({
            code: "custom",
            path: ["lists", listKey, "cardIds", index],
            message: "Ссылка на карточку не найдена.",
          });
          return;
        }

        if (card.listId !== listKey) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardId, "listId"],
            message: "Родительский список карточки не совпадает с порядком списка.",
          });
        }

        if (card.isArchived) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardId, "isArchived"],
            message: "Архивная карточка не должна находиться в порядке активного списка.",
          });
        }
      });
    }

    for (const [cardKey, card] of Object.entries(board.cards)) {
      if (card.id !== cardKey) {
        context.addIssue({
          code: "custom",
          path: ["cards", cardKey, "id"],
          message: "Ключ карточки должен совпадать с её id.",
        });
      }

      const seenCardLabelIds = new Set<string>();
      card.labelIds.forEach((labelId, index) => {
        if (seenCardLabelIds.has(labelId)) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "labelIds", index],
            message: "Метка не должна повторяться на карточке.",
          });
        }

        seenCardLabelIds.add(labelId);

        if (!board.labels[labelId]) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "labelIds", index],
            message: "Карточка ссылается на несуществующую метку.",
          });
        }
      });

      if (!board.lists[card.listId]) {
        context.addIssue({
          code: "custom",
          path: ["cards", cardKey, "listId"],
          message: "Родительский список карточки не найден.",
        });
      }

      if (card.isArchived && cardOwners.has(cardKey)) {
        context.addIssue({
          code: "custom",
          path: ["cards", cardKey],
          message: "Архивная карточка не должна входить в порядок списка.",
        });
      }

      if (!card.isArchived && !cardOwners.has(cardKey)) {
        context.addIssue({
          code: "custom",
          path: ["cards", cardKey],
          message: "Активная карточка отсутствует в порядке своего списка.",
        });
      }

      if (card.isArchived && card.archivedAt === undefined) {
        context.addIssue({
          code: "custom",
          path: ["cards", cardKey, "archivedAt"],
          message: "У архивной карточки должно быть время архивации.",
        });
      }

      if (!card.isArchived && card.archivedAt !== undefined) {
        context.addIssue({
          code: "custom",
          path: ["cards", cardKey, "archivedAt"],
          message: "У активной карточки не должно быть времени архивации.",
        });
      }
    }
  });
