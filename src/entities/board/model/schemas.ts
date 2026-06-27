import { z } from "zod";

const boardBackgroundValues = ["midnight", "ocean", "violet", "forest", "ember", "custom"] as const;
const cardColorValues = ["slate", "navy", "plum", "sand", "frost", "custom"] as const;
const labelValues = ["none", "blue", "violet", "orange", "green"] as const;

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Ожидается цвет в формате #RRGGBB.");

const boardAppearanceSchema = z.object({
  background: z.enum(boardBackgroundValues),
  customBackgroundColor: hexColorSchema.optional(),
  cardColor: z.enum(cardColorValues),
  customCardColor: hexColorSchema.optional(),
});

const boardCardSchema = z.object({
  id: z.string().min(1),
  listId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  dueDate: z.string().optional(),
  label: z.enum(labelValues),
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

export const boardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  appearance: boardAppearanceSchema,
  listIds: z.array(z.string().min(1)),
  lists: z.record(z.string(), boardListSchema),
  cards: z.record(z.string(), boardCardSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});
