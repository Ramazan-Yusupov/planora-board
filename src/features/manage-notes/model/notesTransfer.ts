import { z } from "zod";

import { createId } from "@/shared/lib";

import { parseNotes, type Note, type NoteBlock, type NoteBlockType } from "./notesStorage";

const NOTES_EXPORT_VERSION = 1;

type NotesExportScope = "all" | "note";

type NotesExportPayload = Readonly<{
  format: "planora-notes";
  version: typeof NOTES_EXPORT_VERSION;
  exportedAt: string;
  scope: NotesExportScope;
  activeNoteId: string | null;
  notes: Note[];
}>;

export type NotesImportResult = Readonly<{
  notes: Note[];
  source: "notes" | "workspace" | "legacy" | "markdown";
}>;

const notesPayloadSchema = z.object({
  format: z.literal("planora-notes"),
  version: z.literal(NOTES_EXPORT_VERSION),
  exportedAt: z.string().datetime().or(z.string().min(1)),
  scope: z.enum(["all", "note"]),
  activeNoteId: z.string().min(1).nullable(),
  notes: z.array(z.unknown()).min(1),
});

const workspacePayloadWithNotesSchema = z.object({
  format: z.literal("planora-workspace"),
  notes: z.array(z.unknown()).optional(),
});

function getSafeFilePart(value: string): string {
  return value.toLowerCase().replace(/[^a-zа-я0-9]+/giu, "-") || "note";
}

function createMarkdownBlock(
  type: NoteBlockType,
  text = "",
  patch: Partial<NoteBlock> = {},
): NoteBlock {
  return {
    id: createId("note-block"),
    text,
    type,
    ...patch,
  };
}

function escapeTableCell(value: string): string {
  return value.replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function getBlockMarkdownText(block: NoteBlock): string {
  return block.text.trim();
}

function getChildrenByParentId(blocks: readonly NoteBlock[]) {
  const childrenByParentId = new Map<string, NoteBlock[]>();

  for (const block of blocks) {
    if (!block.parentId) {
      continue;
    }

    const children = childrenByParentId.get(block.parentId) ?? [];
    children.push(block);
    childrenByParentId.set(block.parentId, children);
  }

  return childrenByParentId;
}

function blockToMarkdown(
  block: NoteBlock,
  childrenByParentId: ReadonlyMap<string, readonly NoteBlock[]>,
  depth = 0,
): string {
  const indent = "  ".repeat(depth);
  const text = getBlockMarkdownText(block);

  switch (block.type) {
    case "heading1":
      return `# ${text}`;
    case "heading2":
      return `## ${text}`;
    case "heading3":
      return `### ${text}`;
    case "heading4":
      return `#### ${text}`;
    case "bulleted":
      return `${indent}- ${text}`;
    case "numbered":
      return `${indent}1. ${text}`;
    case "todo":
      return `${indent}- [${block.checked ? "x" : " "}] ${text}`;
    case "quote":
      return text
        .split(/\r?\n/)
        .map((line) => `> ${line}`)
        .join("\n");
    case "callout":
      return `> [!NOTE]\n> ${text}`;
    case "code":
      return `\`\`\`\n${block.text}\n\`\`\``;
    case "divider":
      return "---";
    case "table": {
      const rows = block.tableCells?.length ? block.tableCells : [[""]];
      const headerRow = rows[0] ?? [""];
      const divider = headerRow.map(() => "---");
      const bodyRows = block.tableHasHeaderRow === false ? rows : rows.slice(1);
      const tableRows = [
        headerRow,
        divider,
        ...bodyRows,
      ].map((row) => `| ${row.map(escapeTableCell).join(" | ")} |`);

      return tableRows.join("\n");
    }
    case "toggle": {
      const children = childrenByParentId.get(block.id) ?? [];
      const childMarkdown = children
        .map((child) => blockToMarkdown(child, childrenByParentId, depth + 1))
        .filter(Boolean)
        .join("\n\n");

      return childMarkdown
        ? `<details>\n<summary>${text}</summary>\n\n${childMarkdown}\n\n</details>`
        : `<details>\n<summary>${text}</summary>\n</details>`;
    }
    case "linked-card":
      return block.linkedBoardId && block.linkedCardId
        ? `[${text || "Связанная задача"}](planora://board/${block.linkedBoardId}/card/${block.linkedCardId})`
        : text;
    default:
      return text;
  }
}

export function noteToMarkdown(note: Note): string {
  const childrenByParentId = getChildrenByParentId(note.blocks);
  const rootBlocks = note.blocks.filter((block) => !block.parentId);
  const body = rootBlocks
    .map((block) => blockToMarkdown(block, childrenByParentId))
    .filter(Boolean)
    .join("\n\n");

  return `# ${note.title || "Без названия"}\n\n${body}`.trimEnd() + "\n";
}

function parseMarkdownTable(lines: readonly string[]): string[][] | null {
  if (lines.length < 2 || !lines.every((line) => line.trim().startsWith("|"))) {
    return null;
  }

  const dividerCells = lines[1]
    ?.trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

  if (!dividerCells?.every((cell) => /^:?-{3,}:?$/.test(cell))) {
    return null;
  }

  return lines
    .filter((_, index) => index !== 1)
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim().replaceAll("\\|", "|")),
    );
}

export function parseMarkdownBlocks(markdown: string): NoteBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: NoteBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trimEnd();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index]?.startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }

      blocks.push(createMarkdownBlock("code", codeLines.join("\n")));
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];

      while (index < lines.length && lines[index]?.trim().startsWith("|")) {
        tableLines.push(lines[index] ?? "");
        index += 1;
      }

      const tableCells = parseMarkdownTable(tableLines);

      if (tableCells) {
        blocks.push(
          createMarkdownBlock("table", "", {
            tableCells,
            tableHasHeaderRow: true,
          }),
        );
        continue;
      }
    }

    if (trimmed.startsWith("#### ")) {
      blocks.push(createMarkdownBlock("heading4", trimmed.slice(5)));
    } else if (trimmed.startsWith("### ")) {
      blocks.push(createMarkdownBlock("heading3", trimmed.slice(4)));
    } else if (trimmed.startsWith("## ")) {
      blocks.push(createMarkdownBlock("heading2", trimmed.slice(3)));
    } else if (trimmed.startsWith("# ")) {
      blocks.push(createMarkdownBlock("heading1", trimmed.slice(2)));
    } else if (trimmed === "---") {
      blocks.push(createMarkdownBlock("divider"));
    } else if (trimmed.startsWith("- [ ] ")) {
      blocks.push(
        createMarkdownBlock("todo", trimmed.slice(6), { checked: false }),
      );
    } else if (trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
      blocks.push(
        createMarkdownBlock("todo", trimmed.slice(6), { checked: true }),
      );
    } else if (trimmed.startsWith("- ")) {
      blocks.push(createMarkdownBlock("bulleted", trimmed.slice(2)));
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push(
        createMarkdownBlock("numbered", trimmed.replace(/^\d+\.\s/, "")),
      );
    } else if (trimmed.startsWith("> [!NOTE]")) {
      const nextLine = lines[index + 1]?.replace(/^>\s?/, "") ?? "";
      blocks.push(createMarkdownBlock("callout", nextLine));
      index += nextLine ? 1 : 0;
    } else if (trimmed.startsWith("> ")) {
      blocks.push(createMarkdownBlock("quote", trimmed.slice(2)));
    } else if (trimmed.startsWith("<summary>") && trimmed.endsWith("</summary>")) {
      blocks.push(
        createMarkdownBlock(
          "toggle",
          trimmed.replace(/^<summary>|<\/summary>$/g, ""),
        ),
      );
    } else if (trimmed !== "<details>" && trimmed !== "</details>") {
      blocks.push(createMarkdownBlock("paragraph", trimmed));
    }

    index += 1;
  }

  return blocks.length > 0 ? blocks : [createMarkdownBlock("paragraph")];
}

function markdownToNote(source: string, fileName: string): Note {
  const timestamp = Date.now();
  const blocks = parseMarkdownBlocks(source);
  const firstHeading = blocks.find((block) => block.type === "heading1");
  const fallbackTitle = fileName.replace(/\.(md|markdown)$/i, "");

  return {
    id: createId("note"),
    title: firstHeading?.text.trim() || fallbackTitle || "Markdown импорт",
    blocks,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createNotesExport(
  notes: readonly Note[],
  scope: NotesExportScope,
  noteId?: string,
): NotesExportPayload {
  const selectedNotes =
    scope === "note" && noteId
      ? notes.filter((note) => note.id === noteId)
      : [...notes];

  if (selectedNotes.length === 0) {
    throw new Error("Не удалось найти заметку для экспорта.");
  }

  return {
    format: "planora-notes",
    version: NOTES_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    scope,
    activeNoteId: selectedNotes.some((note) => note.id === noteId)
      ? noteId ?? null
      : selectedNotes[0]?.id ?? null,
    notes: selectedNotes,
  };
}

export function downloadNotesExport(
  notes: readonly Note[],
  scope: NotesExportScope,
  noteId?: string,
): void {
  const payload = createNotesExport(notes, scope, noteId);
  const fileName =
    scope === "note" && payload.notes[0]
      ? `planora-note-${getSafeFilePart(payload.notes[0].title)}.json`
      : "planora-notes-backup.json";
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadNoteMarkdown(note: Note): void {
  const blob = new Blob([noteToMarkdown(note)], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `planora-note-${getSafeFilePart(note.title)}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function parseNotesImport(file: File): Promise<NotesImportResult> {
  const source = await file.text();
  let rawValue: unknown;

  try {
    rawValue = JSON.parse(source);
  } catch {
    return { notes: [markdownToNote(source, file.name)], source: "markdown" };
  }

  const notesPayload = notesPayloadSchema.safeParse(rawValue);

  if (notesPayload.success) {
    const notes = parseNotes(notesPayload.data.notes);

    if (notes.length === 0) {
      throw new Error("В файле нет заметок для импорта.");
    }

    return { notes, source: "notes" };
  }

  const workspacePayload = workspacePayloadWithNotesSchema.safeParse(rawValue);

  if (workspacePayload.success) {
    const notes = workspacePayload.data.notes
      ? parseNotes(workspacePayload.data.notes)
      : [];

    if (notes.length === 0) {
      throw new Error("В резервной копии workspace нет заметок.");
    }

    return { notes, source: "workspace" };
  }

  const legacyNotes = parseNotes(rawValue);

  if (legacyNotes.length > 0) {
    return { notes: legacyNotes, source: "legacy" };
  }

  throw new Error("Файл не похож на резервную копию заметок Planora.");
}
