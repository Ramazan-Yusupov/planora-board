import type { BoardWorkspace } from "@/entities/board";
import type { Note, NoteBlock } from "@/features/manage-notes";

export type WorkspaceHealthFixKind =
  | "active-board"
  | "note-board-link"
  | "note-block-parent"
  | "note-table"
  | "linked-card";

export type WorkspaceHealthFixSummary = Readonly<{
  kind: WorkspaceHealthFixKind;
  title: string;
  description: string;
  count: number;
}>;

export type WorkspaceHealthFixPlan = Readonly<{
  fixes: WorkspaceHealthFixSummary[];
  totalCount: number;
}>;

export type WorkspaceHealthFixResult = Readonly<{
  appliedFixes: WorkspaceHealthFixSummary[];
  notes: Note[];
  totalCount: number;
  workspace: BoardWorkspace;
}>;

type FixCounter = Record<WorkspaceHealthFixKind, number>;

const fixDescriptions: Record<
  WorkspaceHealthFixKind,
  Omit<WorkspaceHealthFixSummary, "count" | "kind">
> = {
  "active-board": {
    title: "Активный проект",
    description: "Выбрать первый доступный проект, если activeBoardId указывает в никуда.",
  },
  "note-board-link": {
    title: "Привязки заметок",
    description: "Убрать boardId у заметок, привязанных к удалённым проектам.",
  },
  "note-block-parent": {
    title: "Вложенность Notes",
    description: "Очистить parentId у блоков с удалённым parent или циклической вложенностью.",
  },
  "note-table": {
    title: "Таблицы Notes",
    description: "Выровнять строки таблиц и добавить пустую ячейку в полностью пустые таблицы.",
  },
  "linked-card": {
    title: "Битые ссылки на задачи",
    description: "Преобразовать linked-card блоки без существующей задачи в обычный текстовый блок.",
  },
};

function createCounter(): FixCounter {
  return {
    "active-board": 0,
    "note-board-link": 0,
    "note-block-parent": 0,
    "note-table": 0,
    "linked-card": 0,
  };
}

function toSummary(counter: FixCounter): WorkspaceHealthFixSummary[] {
  return (Object.keys(counter) as WorkspaceHealthFixKind[]).flatMap((kind) => {
    const count = counter[kind];

    if (count === 0) {
      return [];
    }

    return [
      {
        kind,
        count,
        ...fixDescriptions[kind],
      },
    ];
  });
}

function hasParentCycle(
  block: NoteBlock,
  blockById: ReadonlyMap<string, NoteBlock>,
): boolean {
  const visitedIds = new Set<string>();
  let currentBlock: NoteBlock | undefined = block;

  while (currentBlock?.parentId) {
    if (currentBlock.parentId === block.id || visitedIds.has(currentBlock.parentId)) {
      return true;
    }

    visitedIds.add(currentBlock.parentId);
    currentBlock = blockById.get(currentBlock.parentId);
  }

  return false;
}

function getFixedTableCells(
  tableCells: string[][] | undefined,
): { cells: string[][]; didChange: boolean } {
  if (!tableCells || tableCells.length === 0) {
    return { cells: [[""]], didChange: true };
  }

  const columnCount = Math.max(1, ...tableCells.map((row) => row.length));
  const cells = tableCells.map((row) => [
    ...row,
    ...Array.from({ length: columnCount - row.length }, () => ""),
  ]);
  const didChange = tableCells.some((row) => row.length !== columnCount);

  return { cells, didChange };
}

function getBlockText(block: NoteBlock): string {
  const text = block.text.trim();

  if (text) {
    return text;
  }

  return "Связь с задачей удалена: исходная карточка не найдена.";
}

function getBoardById(workspace: BoardWorkspace) {
  return new Map(workspace.boards.map((board) => [board.id, board]));
}

function fixWorkspace(
  workspace: BoardWorkspace,
  counter: FixCounter,
): BoardWorkspace {
  if (
    workspace.activeBoardId &&
    workspace.boards.some((board) => board.id === workspace.activeBoardId)
  ) {
    return workspace;
  }

  const activeBoardId = workspace.boards[0]?.id ?? null;

  if (activeBoardId === workspace.activeBoardId) {
    return workspace;
  }

  counter["active-board"] += 1;

  return {
    ...workspace,
    activeBoardId,
  };
}

function fixNotes(
  workspace: BoardWorkspace,
  notes: readonly Note[],
  counter: FixCounter,
): Note[] {
  const boardById = getBoardById(workspace);

  return notes.map((note) => {
    const blockById = new Map(note.blocks.map((block) => [block.id, block]));
    let didChangeNote = false;
    let nextNote: Note = note;

    if (note.boardId && !boardById.has(note.boardId)) {
      const noteWithoutBoard = { ...nextNote };
      delete noteWithoutBoard.boardId;
      nextNote = noteWithoutBoard;
      didChangeNote = true;
      counter["note-board-link"] += 1;
    }

    const blocks = note.blocks.map((block) => {
      let nextBlock: NoteBlock = block;

      if (
        block.parentId &&
        (!blockById.has(block.parentId) || hasParentCycle(block, blockById))
      ) {
        const blockWithoutParent = { ...nextBlock };
        delete blockWithoutParent.parentId;
        nextBlock = blockWithoutParent;
        didChangeNote = true;
        counter["note-block-parent"] += 1;
      }

      if (nextBlock.type === "table") {
        const { cells, didChange } = getFixedTableCells(nextBlock.tableCells);

        if (didChange) {
          nextBlock = {
            ...nextBlock,
            tableCells: cells,
          };
          didChangeNote = true;
          counter["note-table"] += 1;
        }
      }

      if (nextBlock.type === "linked-card") {
        const linkedBoardId = nextBlock.linkedBoardId ?? nextNote.boardId;
        const linkedBoard = linkedBoardId ? boardById.get(linkedBoardId) : undefined;
        const linkedCard = nextBlock.linkedCardId
          ? linkedBoard?.cards[nextBlock.linkedCardId]
          : undefined;

        if (!linkedBoardId || !nextBlock.linkedCardId || !linkedBoard || !linkedCard) {
          nextBlock = {
            id: nextBlock.id,
            text: getBlockText(nextBlock),
            type: "paragraph",
          };
          didChangeNote = true;
          counter["linked-card"] += 1;
        }
      }

      return nextBlock;
    });

    if (!didChangeNote) {
      return note;
    }

    return {
      ...nextNote,
      blocks,
      updatedAt: Date.now(),
    };
  });
}

export function getWorkspaceHealthFixPlan(
  workspace: BoardWorkspace,
  notes: readonly Note[],
): WorkspaceHealthFixPlan {
  const counter = createCounter();

  fixNotes(fixWorkspace(workspace, counter), notes, counter);

  const fixes = toSummary(counter);

  return {
    fixes,
    totalCount: fixes.reduce((count, fix) => count + fix.count, 0),
  };
}

export function applyWorkspaceHealthFixes(
  workspace: BoardWorkspace,
  notes: readonly Note[],
): WorkspaceHealthFixResult {
  const counter = createCounter();
  const nextWorkspace = fixWorkspace(workspace, counter);
  const nextNotes = fixNotes(nextWorkspace, notes, counter);
  const appliedFixes = toSummary(counter);

  return {
    appliedFixes,
    notes: nextNotes,
    totalCount: appliedFixes.reduce((count, fix) => count + fix.count, 0),
    workspace: nextWorkspace,
  };
}
