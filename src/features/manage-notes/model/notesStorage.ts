import { z } from "zod";

import { createId } from "@/shared/lib";

export const NOTES_STORAGE_KEY = "planora.notes.v1";

export const NOTE_STATUS_OPTIONS = [
  { label: "Черновик", value: "draft" },
  { label: "Активная", value: "active" },
  { label: "Архив", value: "archived" },
] as const;

export type NoteStatus = (typeof NOTE_STATUS_OPTIONS)[number]["value"];

export type NoteBlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "bulleted"
  | "numbered"
  | "todo"
  | "toggle"
  | "quote"
  | "callout"
  | "code"
  | "table"
  | "linked-card"
  | "divider";

export type NoteBlock = Readonly<{
  id: string;
  boardId?: string;
  text: string;
  type: NoteBlockType;
  backgroundColor?: string;
  checked?: boolean;
  collapsed?: boolean;
  html?: string;
  linkedBoardId?: string;
  linkedCardId?: string;
  parentId?: string;
  tableHasHeaderRow?: boolean;
  tableCells?: string[][];
  textColor?: string;
}>;

const noteBlockTypes = [
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "heading4",
  "bulleted",
  "numbered",
  "todo",
  "toggle",
  "quote",
  "callout",
  "code",
  "table",
  "linked-card",
  "divider",
] as const;

export type Note = Readonly<{
  id: string;
  boardId?: string;
  title: string;
  status: NoteStatus;
  tags: string[];
  dueDate?: string;
  linkedBoardId?: string;
  linkedCardId?: string;
  blocks: NoteBlock[];
  createdAt: number;
  updatedAt: number;
}>;

const noteStatusValues = NOTE_STATUS_OPTIONS.map((option) => option.value) as [
  NoteStatus,
  ...NoteStatus[],
];

const noteBlockSchema = z.object({
  id: z.string().min(1),
  boardId: z.string().optional(),
  text: z.string(),
  type: z.enum(noteBlockTypes),
  backgroundColor: z.string().optional(),
  checked: z.boolean().optional(),
  collapsed: z.boolean().optional(),
  html: z.string().optional(),
  linkedBoardId: z.string().optional(),
  linkedCardId: z.string().optional(),
  parentId: z.string().optional(),
  tableHasHeaderRow: z.boolean().optional(),
  tableCells: z.array(z.array(z.string())).optional(),
  textColor: z.string().optional(),
});

const noteSchema = z.object({
  id: z.string().min(1),
  boardId: z.string().optional(),
  title: z.string(),
  status: z.enum(noteStatusValues).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  linkedBoardId: z.string().optional(),
  linkedCardId: z.string().optional(),
  blocks: z.array(noteBlockSchema).optional(),
  content: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export function normalizeNoteTags(tags: readonly string[] | string | undefined): string[] {
  const source: readonly string[] =
    typeof tags === "string" ? tags.split(/[,#]/) : (tags ?? []);
  const seenTags = new Set<string>();

  return source.flatMap((tag) => {
    const normalizedTag = tag
      .trim()
      .replace(/^#+/, "")
      .replace(/\s+/g, "-")
      .toLocaleLowerCase("ru-RU");

    if (!normalizedTag || seenTags.has(normalizedTag)) {
      return [];
    }

    seenTags.add(normalizedTag);
    return [normalizedTag];
  }).slice(0, 8);
}

export function normalizeNoteDueDate(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue && /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)
    ? normalizedValue
    : undefined;
}

function createBlock(type: NoteBlockType, text = ""): NoteBlock {
  return {
    id: createId("note-block"),
    text,
    type,
  };
}

function contentToBlocks(content: string | undefined): NoteBlock[] {
  const source = content?.trimEnd() || "# Новая заметка\n\n- [ ] Связать с задачей\n- Добавить детали";
  const blocks = source.split("\n").flatMap((line): NoteBlock[] => {
    if (line.startsWith("#### ")) {
      return [createBlock("heading4", line.slice(5))];
    }

    if (line.startsWith("### ")) {
      return [createBlock("heading3", line.slice(4))];
    }

    if (line.startsWith("## ")) {
      return [createBlock("heading2", line.slice(3))];
    }

    if (line.startsWith("# ")) {
      return [createBlock("heading1", line.slice(2))];
    }

    if (line === "---") {
      return [createBlock("divider")];
    }

    if (line.startsWith("- [ ] ")) {
      return [{ ...createBlock("todo", line.slice(6)), checked: false }];
    }

    if (line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
      return [{ ...createBlock("todo", line.slice(6)), checked: true }];
    }

    if (line.startsWith("- ")) {
      return [createBlock("bulleted", line.slice(2))];
    }

    if (/^\d+\.\s/.test(line)) {
      return [createBlock("numbered", line.replace(/^\d+\.\s/, ""))];
    }

    if (line.startsWith("> ")) {
      return [createBlock("quote", line.slice(2))];
    }

    return [createBlock("paragraph", line)];
  });

  return blocks.length > 0 ? blocks : [createBlock("paragraph")];
}

export function createNote(boardId?: string): Note {
  const timestamp = Date.now();

  return {
    id: createId("note"),
    boardId,
    title: "Новая заметка",
    status: "active",
    tags: [],
    blocks: contentToBlocks(undefined),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function parseNotes(value: unknown): Note[] {
  const parsed = z.array(noteSchema).safeParse(value);

  if (!parsed.success) {
    return [];
  }

  return parsed.data.flatMap((note): Note[] => {
    const timestamp = Date.now();
    const blocks =
      note.blocks && note.blocks.length > 0
        ? note.blocks
        : contentToBlocks(note.content);

    return [
      {
        id: note.id,
        boardId: note.boardId,
        title: note.title.trim() || "Без названия",
        status: note.status ?? "active",
        tags: normalizeNoteTags(note.tags),
        dueDate: normalizeNoteDueDate(note.dueDate),
        linkedBoardId: note.linkedBoardId,
        linkedCardId: note.linkedCardId,
        blocks,
        createdAt: note.createdAt ?? timestamp,
        updatedAt: note.updatedAt ?? timestamp,
      },
    ];
  });
}

export function loadNotes(): Note[] {
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    const notes = raw ? parseNotes(JSON.parse(raw)) : [];

    return notes.length > 0 ? notes : [createNote()];
  } catch {
    return [createNote()];
  }
}

export function saveNotes(notes: readonly Note[]): void {
  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export function exportStoredNotes(): Note[] {
  return loadNotes();
}

export function replaceStoredNotes(notes: readonly Note[] | undefined): void {
  if (!notes) {
    return;
  }

  saveNotes(notes);
}
