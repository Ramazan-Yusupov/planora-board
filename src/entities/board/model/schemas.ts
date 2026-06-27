import { z } from "zod";

import type { Board } from "./types";

const labelValues = ["none", "blue", "violet", "orange", "green"] as const;

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

export const boardSchema: z.ZodType<Board> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  listIds: z.array(z.string().min(1)),
  lists: z.record(z.string(), boardListSchema),
  cards: z.record(z.string(), boardCardSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});
