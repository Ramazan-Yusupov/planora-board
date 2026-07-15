import { z } from "zod";

import { parseBoardData, type Board, type BoardWorkspace } from "@/entities/board";
import {
  exportStoredNotes,
  parseNotes,
  type Note,
} from "@/features/manage-notes";

export const WORKSPACE_EXPORT_VERSION = 1;

type ExportScope = "workspace" | "board";

type WorkspaceExportPayload = Readonly<{
  format: "planora-workspace";
  version: typeof WORKSPACE_EXPORT_VERSION;
  exportedAt: string;
  scope: ExportScope;
  activeBoardId: string | null;
  boards: Board[];
  attachmentsIncluded: false;
  notes?: Note[];
}>;

export type WorkspaceImportResult = Readonly<{
  notes?: Note[];
  workspace: BoardWorkspace;
}>;

const payloadSchema = z.object({
  format: z.literal("planora-workspace"),
  version: z.literal(WORKSPACE_EXPORT_VERSION),
  exportedAt: z.string().datetime().or(z.string().min(1)),
  scope: z.enum(["workspace", "board"]),
  activeBoardId: z.string().min(1).nullable(),
  boards: z.array(z.unknown()).min(1),
  attachmentsIncluded: z.literal(false).optional(),
  notes: z.array(z.unknown()).optional(),
});

function withoutAttachmentData(board: Board): Board {
  return {
    ...board,
    attachmentIds: [],
    attachments: {},
    cards: Object.fromEntries(
      Object.entries(board.cards).map(([cardId, card]) => [
        cardId,
        {
          ...card,
          attachmentIds: [],
          cover: card.cover?.type === "attachment" ? undefined : card.cover,
        },
      ]),
    ),
  };
}

export function createWorkspaceExport(
  workspace: BoardWorkspace,
  scope: ExportScope,
  boardId?: string,
): WorkspaceExportPayload {
  const boards =
    scope === "board" && boardId
      ? workspace.boards.filter((board) => board.id === boardId)
      : workspace.boards;

  if (boards.length === 0) {
    throw new Error("Не удалось найти проект для экспорта.");
  }

  return {
    format: "planora-workspace",
    version: WORKSPACE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    scope,
    activeBoardId: boards.some((board) => board.id === workspace.activeBoardId)
      ? workspace.activeBoardId
      : boards[0].id,
    boards: boards.map(withoutAttachmentData),
    attachmentsIncluded: false,
    notes: scope === "workspace" ? exportStoredNotes() : undefined,
  };
}

export function downloadWorkspaceExport(
  workspace: BoardWorkspace,
  scope: ExportScope,
  boardId?: string,
): void {
  const payload = createWorkspaceExport(workspace, scope, boardId);
  const fileName =
    scope === "board" && payload.boards[0]
      ? `planora-${payload.boards[0].title.toLowerCase().replace(/[^a-zа-я0-9]+/giu, "-") || "project"}.json`
      : "planora-backup.json";
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

export async function parseWorkspaceImport(
  file: File,
): Promise<WorkspaceImportResult> {
  const source = await file.text();
  let rawValue: unknown;

  try {
    rawValue = JSON.parse(source);
  } catch {
    throw new Error("Файл не содержит корректный JSON.");
  }

  const payload = payloadSchema.safeParse(rawValue);

  if (!payload.success) {
    throw new Error("Файл не похож на резервную копию Planora.");
  }

  const boards = payload.data.boards.map((rawBoard) => {
    const board = parseBoardData(rawBoard);
    return withoutAttachmentData(board);
  });
  const uniqueIds = new Set(boards.map((board) => board.id));

  if (uniqueIds.size !== boards.length) {
    throw new Error("В файле есть несколько проектов с одинаковым ID.");
  }

  const activeBoardId = boards.some((board) => board.id === payload.data.activeBoardId)
    ? payload.data.activeBoardId
    : boards[0]?.id ?? null;

  return {
    workspace: { boards, activeBoardId },
    notes: payload.data.notes ? parseNotes(payload.data.notes) : undefined,
  };
}
