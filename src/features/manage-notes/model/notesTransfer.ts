import { z } from "zod";

import { parseNotes, type Note } from "./notesStorage";

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
  source: "notes" | "workspace" | "legacy";
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

export async function parseNotesImport(file: File): Promise<NotesImportResult> {
  const source = await file.text();
  let rawValue: unknown;

  try {
    rawValue = JSON.parse(source);
  } catch {
    throw new Error("Файл не содержит корректный JSON.");
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
