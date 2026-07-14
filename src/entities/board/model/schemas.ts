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
const boardActivityTypeValues = [
  "card-created",
  "card-title-updated",
  "card-description-updated",
  "card-due-date-set",
  "card-due-date-changed",
  "card-due-date-removed",
  "card-labels-updated",
  "card-members-updated",
  "card-priority-updated",
  "card-status-updated",
  "card-start-date-updated",
  "card-custom-fields-updated",
  "card-sticker-updated",
  "card-moved",
  "card-archived",
  "card-restored",
  "card-duplicated",
  "comment-created",
  "comment-updated",
  "comment-deleted",
  "checklist-created",
  "checklist-renamed",
  "checklist-deleted",
  "checklist-item-created",
  "checklist-item-renamed",
  "checklist-item-toggled",
  "checklist-item-deleted",
  "checklist-item-moved",
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

const boardMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(48),
  avatarColor: hexColorSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardCommentSchema = z.object({
  id: z.string().min(1),
  cardId: z.string().min(1),
  authorName: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(1000),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardChecklistItemSchema = z.object({
  id: z.string().min(1),
  checklistId: z.string().min(1),
  title: z.string().trim().min(1).max(320),
  isCompleted: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardChecklistSchema = z.object({
  id: z.string().min(1),
  cardId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  itemIds: z.array(z.string().min(1)).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardActivitySchema = z.object({
  id: z.string().min(1),
  cardId: z.string().min(1),
  actorName: z.string().trim().min(1).max(80),
  type: z.enum(boardActivityTypeValues),
  message: z.string().trim().min(1).max(500),
  createdAt: z.number(),
});

const cardCoverSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("color"),
    color: hexColorSchema,
  }),
  z.object({
    type: z.literal("attachment"),
    attachmentId: z.string().min(1),
  }),
]);

const boardAttachmentSchema = z.object({
  id: z.string().min(1),
  cardId: z.string().min(1),
  name: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(160),
  size: z.number().int().nonnegative().max(10 * 1024 * 1024),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardCardCustomFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(64),
  value: z.string().trim().max(240),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardCustomFieldTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(64),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardChecklistTemplateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const boardCardOptionSchema = z.object({
  id: z.string().min(1).max(64),
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
  status: z.string().min(1).max(64).default("none"),
  priority: z.string().min(1).max(64).default("none"),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.number().optional(),
  labelIds: z.array(z.string().min(1)).default([]),
  memberIds: z.array(z.string().min(1)).default([]),
  customFields: z.array(boardCardCustomFieldSchema).default([]),
  // Чек-листы добавлены после первой версии доски. Для старых записей
  // пустой массив создаётся при чтении и сохраняется при следующей записи.
  checklistIds: z.array(z.string().min(1)).default([]),
  attachmentIds: z.array(z.string().min(1)).default([]),
  commentIds: z.array(z.string().min(1)).default([]),
  cover: cardCoverSchema.optional(),
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
  isArchived: z.boolean().default(false),
  archivedAt: z.number().optional(),
  wipLimit: z.number().int().positive().max(999).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const boardSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    appearance: boardAppearanceSchema,
    cardStatusLabels: z.record(z.string(), z.string().trim().min(1).max(48)).default({}),
    cardPriorityLabels: z.record(z.string(), z.string().trim().min(1).max(48)).default({}),
    cardStatuses: z.array(boardCardOptionSchema).max(10).default([]),
    cardPriorities: z.array(boardCardOptionSchema).max(10).default([]),
    coverColors: z.array(hexColorSchema).default([]),
    customFieldTemplates: z.array(boardCustomFieldTemplateSchema).default([]),
    checklistTemplates: z.array(boardChecklistTemplateSchema).default([]),
    labelIds: z.array(z.string().min(1)),
    labels: z.record(z.string(), boardLabelSchema),
    memberIds: z.array(z.string().min(1)).default([]),
    members: z.record(z.string(), boardMemberSchema).default({}),
    checklistIds: z.array(z.string().min(1)).default([]),
    checklists: z.record(z.string(), boardChecklistSchema).default({}),
    checklistItems: z
      .record(z.string(), boardChecklistItemSchema)
      .default({}),
    commentIds: z.array(z.string().min(1)).default([]),
    comments: z.record(z.string(), boardCommentSchema).default({}),
    attachmentIds: z.array(z.string().min(1)).default([]),
    attachments: z.record(z.string(), boardAttachmentSchema).default({}),
    activityIds: z.array(z.string().min(1)).default([]),
    activities: z.record(z.string(), boardActivitySchema).default({}),
    listIds: z.array(z.string().min(1)),
    lists: z.record(z.string(), boardListSchema),
    cards: z.record(z.string(), boardCardSchema),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .superRefine((board, context) => {
    const boardLabelIds = new Set<string>();
    const boardMemberIds = new Set<string>();
    const boardChecklistIds = new Set<string>();
    const boardCommentIds = new Set<string>();
    const boardActivityIds = new Set<string>();
    const boardListIds = new Set<string>();
    const cardOwners = new Map<string, string>();
    const checklistOwners = new Map<string, string>();
    const checklistItemOwners = new Map<string, string>();
    const commentOwners = new Map<string, string>();

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

    board.memberIds.forEach((memberId, index) => {
      if (boardMemberIds.has(memberId)) {
        context.addIssue({
          code: "custom",
          path: ["memberIds", index],
          message: "Участник не должен повторяться в порядке проекта.",
        });
      }

      boardMemberIds.add(memberId);

      if (!board.members[memberId]) {
        context.addIssue({
          code: "custom",
          path: ["memberIds", index],
          message: "Ссылка на участника не найдена.",
        });
      }
    });

    for (const [memberKey, member] of Object.entries(board.members)) {
      if (member.id !== memberKey) {
        context.addIssue({
          code: "custom",
          path: ["members", memberKey, "id"],
          message: "Ключ участника должен совпадать с его id.",
        });
      }

      if (!boardMemberIds.has(memberKey)) {
        context.addIssue({
          code: "custom",
          path: ["members", memberKey],
          message: "Участник отсутствует в порядке проекта.",
        });
      }
    }

    const boardAttachmentIds = new Set<string>();
    const attachmentOwners = new Map<string, string>();

    board.attachmentIds.forEach((attachmentId, index) => {
      if (boardAttachmentIds.has(attachmentId)) {
        context.addIssue({
          code: "custom",
          path: ["attachmentIds", index],
          message: "Вложение не должно повторяться в порядке проекта.",
        });
      }

      boardAttachmentIds.add(attachmentId);

      if (!board.attachments[attachmentId]) {
        context.addIssue({
          code: "custom",
          path: ["attachmentIds", index],
          message: "Ссылка на вложение не найдена.",
        });
      }
    });

    for (const [attachmentKey, attachment] of Object.entries(board.attachments)) {
      if (attachment.id !== attachmentKey) {
        context.addIssue({
          code: "custom",
          path: ["attachments", attachmentKey, "id"],
          message: "Ключ вложения должен совпадать с его id.",
        });
      }

      if (!boardAttachmentIds.has(attachmentKey)) {
        context.addIssue({
          code: "custom",
          path: ["attachments", attachmentKey],
          message: "Вложение отсутствует в порядке проекта.",
        });
      }

      if (!board.cards[attachment.cardId]) {
        context.addIssue({
          code: "custom",
          path: ["attachments", attachmentKey, "cardId"],
          message: "Родительская карточка вложения не найдена.",
        });
      }
    }

    board.commentIds.forEach((commentId, index) => {
      if (boardCommentIds.has(commentId)) {
        context.addIssue({
          code: "custom",
          path: ["commentIds", index],
          message: "Комментарий не должен повторяться в порядке проекта.",
        });
      }

      boardCommentIds.add(commentId);

      if (!board.comments[commentId]) {
        context.addIssue({
          code: "custom",
          path: ["commentIds", index],
          message: "Ссылка на комментарий не найдена.",
        });
      }
    });

    for (const [commentKey, comment] of Object.entries(board.comments)) {
      if (comment.id !== commentKey) {
        context.addIssue({
          code: "custom",
          path: ["comments", commentKey, "id"],
          message: "Ключ комментария должен совпадать с его id.",
        });
      }

      if (!boardCommentIds.has(commentKey)) {
        context.addIssue({
          code: "custom",
          path: ["comments", commentKey],
          message: "Комментарий отсутствует в порядке проекта.",
        });
      }

      if (!board.cards[comment.cardId]) {
        context.addIssue({
          code: "custom",
          path: ["comments", commentKey, "cardId"],
          message: "Родительская карточка комментария не найдена.",
        });
      }
    }

    board.activityIds.forEach((activityId, index) => {
      if (boardActivityIds.has(activityId)) {
        context.addIssue({
          code: "custom",
          path: ["activityIds", index],
          message: "Событие не должно повторяться в истории.",
        });
      }

      boardActivityIds.add(activityId);

      if (!board.activities[activityId]) {
        context.addIssue({
          code: "custom",
          path: ["activityIds", index],
          message: "Ссылка на событие истории не найдена.",
        });
      }
    });

    for (const [activityKey, activity] of Object.entries(board.activities)) {
      if (activity.id !== activityKey) {
        context.addIssue({
          code: "custom",
          path: ["activities", activityKey, "id"],
          message: "Ключ события должен совпадать с его id.",
        });
      }

      if (!boardActivityIds.has(activityKey)) {
        context.addIssue({
          code: "custom",
          path: ["activities", activityKey],
          message: "Событие отсутствует в порядке истории.",
        });
      }

      if (!board.cards[activity.cardId]) {
        context.addIssue({
          code: "custom",
          path: ["activities", activityKey, "cardId"],
          message: "Карточка события истории не найдена.",
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

      const seenCardMemberIds = new Set<string>();
      card.memberIds.forEach((memberId, index) => {
        if (seenCardMemberIds.has(memberId)) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "memberIds", index],
            message: "Участник не должен повторяться на карточке.",
          });
        }

        seenCardMemberIds.add(memberId);

        if (!board.members[memberId]) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "memberIds", index],
            message: "Карточка ссылается на несуществующего участника.",
          });
        }
      });

      const seenCustomFieldIds = new Set<string>();
      card.customFields.forEach((field, index) => {
        if (seenCustomFieldIds.has(field.id)) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "customFields", index, "id"],
            message: "Пользовательское поле не должно повторяться на карточке.",
          });
        }

        seenCustomFieldIds.add(field.id);
      });

      if (card.status !== "done" && card.completedAt !== undefined) {
        context.addIssue({
          code: "custom",
          path: ["cards", cardKey, "completedAt"],
          message: "Дата завершения хранится только у готовых карточек.",
        });
      }

      const seenCardChecklistIds = new Set<string>();
      card.checklistIds.forEach((checklistId, index) => {
        if (seenCardChecklistIds.has(checklistId)) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "checklistIds", index],
            message: "Чек-лист не должен повторяться на карточке.",
          });
        }

        seenCardChecklistIds.add(checklistId);
        checklistOwners.set(checklistId, cardKey);

        const checklist = board.checklists[checklistId];

        if (!checklist) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "checklistIds", index],
            message: "Карточка ссылается на несуществующий чек-лист.",
          });
          return;
        }

        if (checklist.cardId !== cardKey) {
          context.addIssue({
            code: "custom",
            path: ["checklists", checklistId, "cardId"],
            message: "Родительская карточка чек-листа не совпадает.",
          });
        }
      });

      const seenCardAttachmentIds = new Set<string>();
      card.attachmentIds.forEach((attachmentId, index) => {
        if (seenCardAttachmentIds.has(attachmentId)) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "attachmentIds", index],
            message: "Вложение не должно повторяться на карточке.",
          });
        }

        seenCardAttachmentIds.add(attachmentId);
        attachmentOwners.set(attachmentId, cardKey);
        const attachment = board.attachments[attachmentId];

        if (!attachment) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "attachmentIds", index],
            message: "Карточка ссылается на несуществующее вложение.",
          });
          return;
        }

        if (attachment.cardId !== cardKey) {
          context.addIssue({
            code: "custom",
            path: ["attachments", attachmentId, "cardId"],
            message: "Родительская карточка вложения не совпадает.",
          });
        }
      });

      const seenCardCommentIds = new Set<string>();
      card.commentIds.forEach((commentId, index) => {
        if (seenCardCommentIds.has(commentId)) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "commentIds", index],
            message: "Комментарий не должен повторяться на карточке.",
          });
        }

        seenCardCommentIds.add(commentId);
        commentOwners.set(commentId, cardKey);
        const comment = board.comments[commentId];

        if (!comment) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "commentIds", index],
            message: "Карточка ссылается на несуществующий комментарий.",
          });
          return;
        }

        if (comment.cardId !== cardKey) {
          context.addIssue({
            code: "custom",
            path: ["comments", commentId, "cardId"],
            message: "Родительская карточка комментария не совпадает.",
          });
        }
      });

      if (card.cover?.type === "attachment") {
        const coverAttachment = board.attachments[card.cover.attachmentId];

        if (!coverAttachment || coverAttachment.cardId !== cardKey) {
          context.addIssue({
            code: "custom",
            path: ["cards", cardKey, "cover"],
            message: "Обложка должна ссылаться на вложение этой карточки.",
          });
        }
      }

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

    for (const [commentKey, comment] of Object.entries(board.comments)) {
      if (commentOwners.get(commentKey) !== comment.cardId) {
        context.addIssue({
          code: "custom",
          path: ["comments", commentKey],
          message: "Комментарий отсутствует в порядке своей карточки.",
        });
      }
    }

    for (const [attachmentKey, attachment] of Object.entries(board.attachments)) {
      if (attachmentOwners.get(attachmentKey) !== attachment.cardId) {
        context.addIssue({
          code: "custom",
          path: ["attachments", attachmentKey],
          message: "Вложение отсутствует в порядке своей карточки.",
        });
      }
    }

    board.checklistIds.forEach((checklistId, index) => {
      if (boardChecklistIds.has(checklistId)) {
        context.addIssue({
          code: "custom",
          path: ["checklistIds", index],
          message: "Чек-лист не должен повторяться в порядке проекта.",
        });
      }

      boardChecklistIds.add(checklistId);

      if (!board.checklists[checklistId]) {
        context.addIssue({
          code: "custom",
          path: ["checklistIds", index],
          message: "Ссылка на чек-лист не найдена.",
        });
      }
    });

    for (const [checklistKey, checklist] of Object.entries(board.checklists)) {
      if (checklist.id !== checklistKey) {
        context.addIssue({
          code: "custom",
          path: ["checklists", checklistKey, "id"],
          message: "Ключ чек-листа должен совпадать с его id.",
        });
      }

      if (!boardChecklistIds.has(checklistKey)) {
        context.addIssue({
          code: "custom",
          path: ["checklists", checklistKey],
          message: "Чек-лист отсутствует в порядке проекта.",
        });
      }

      if (!board.cards[checklist.cardId]) {
        context.addIssue({
          code: "custom",
          path: ["checklists", checklistKey, "cardId"],
          message: "Родительская карточка чек-листа не найдена.",
        });
      }

      if (checklistOwners.get(checklistKey) !== checklist.cardId) {
        context.addIssue({
          code: "custom",
          path: ["checklists", checklistKey],
          message: "Чек-лист отсутствует в порядке своей карточки.",
        });
      }

      const seenChecklistItemIds = new Set<string>();
      checklist.itemIds.forEach((itemId, index) => {
        if (seenChecklistItemIds.has(itemId)) {
          context.addIssue({
            code: "custom",
            path: ["checklists", checklistKey, "itemIds", index],
            message: "Пункт не должен повторяться в порядке чек-листа.",
          });
        }

        seenChecklistItemIds.add(itemId);
        checklistItemOwners.set(itemId, checklistKey);

        const item = board.checklistItems[itemId];

        if (!item) {
          context.addIssue({
            code: "custom",
            path: ["checklists", checklistKey, "itemIds", index],
            message: "Ссылка на пункт чек-листа не найдена.",
          });
          return;
        }

        if (item.checklistId !== checklistKey) {
          context.addIssue({
            code: "custom",
            path: ["checklistItems", itemId, "checklistId"],
            message: "Родительский чек-лист пункта не совпадает.",
          });
        }
      });
    }

    for (const [itemKey, item] of Object.entries(board.checklistItems)) {
      if (item.id !== itemKey) {
        context.addIssue({
          code: "custom",
          path: ["checklistItems", itemKey, "id"],
          message: "Ключ пункта чек-листа должен совпадать с его id.",
        });
      }

      if (!board.checklists[item.checklistId]) {
        context.addIssue({
          code: "custom",
          path: ["checklistItems", itemKey, "checklistId"],
          message: "Родительский чек-лист пункта не найден.",
        });
      }

      if (checklistItemOwners.get(itemKey) !== item.checklistId) {
        context.addIssue({
          code: "custom",
          path: ["checklistItems", itemKey],
          message: "Пункт отсутствует в порядке своего чек-листа.",
        });
      }
    }
  });
