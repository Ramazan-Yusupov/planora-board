import { boardSchema, type Board, type BoardWorkspace } from "@/entities/board";
import type { Note, NoteBlock } from "@/features/manage-notes";

export type WorkspaceHealthSeverity = "danger" | "warning";

export type WorkspaceHealthScope =
  | "workspace"
  | "board"
  | "notes"
  | "links"
  | "backup";

export type WorkspaceHealthIssue = Readonly<{
  id: string;
  severity: WorkspaceHealthSeverity;
  scope: WorkspaceHealthScope;
  title: string;
  description: string;
  boardId?: string;
  noteId?: string;
}>;

export type WorkspaceHealthReport = Readonly<{
  activeCardsCount: number;
  boardsCount: number;
  checkedAt: number;
  dangerCount: number;
  issues: WorkspaceHealthIssue[];
  notesCount: number;
  warningCount: number;
}>;

type EvaluateWorkspaceHealthOptions = Readonly<{
  notes: readonly Note[];
  workspace: BoardWorkspace;
}>;

function createIssue(
  index: number,
  issue: Omit<WorkspaceHealthIssue, "id">,
): WorkspaceHealthIssue {
  return {
    id: `${issue.scope}-${issue.severity}-${index}`,
    ...issue,
  };
}

function getBoardLabel(board: Board | undefined, boardId: string): string {
  return board?.title ? `«${board.title}»` : boardId;
}

function collectDuplicateIds(values: readonly string[]): string[] {
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  values.forEach((value) => {
    if (seenIds.has(value)) {
      duplicateIds.add(value);
      return;
    }

    seenIds.add(value);
  });

  return [...duplicateIds];
}

function getBlockMap(blocks: readonly NoteBlock[]): ReadonlyMap<string, NoteBlock> {
  return new Map(blocks.map((block) => [block.id, block]));
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

function getActiveCardsCount(workspace: BoardWorkspace): number {
  return workspace.boards.reduce((count, board) => {
    const boardActiveCardsCount = Object.values(board.cards).filter((card) => {
      const list = board.lists[card.listId];

      return !card.isArchived && list && !list.isArchived;
    }).length;

    return count + boardActiveCardsCount;
  }, 0);
}

function collectBoardIssues(
  workspace: BoardWorkspace,
  addIssue: (issue: Omit<WorkspaceHealthIssue, "id">) => void,
) {
  const duplicateBoardIds = collectDuplicateIds(
    workspace.boards.map((board) => board.id),
  );

  duplicateBoardIds.forEach((boardId) => {
    addIssue({
      severity: "danger",
      scope: "workspace",
      title: "Повторяется id проекта",
      description: `Workspace содержит несколько проектов с id ${boardId}. Import/export может потерять часть данных.`,
      boardId,
    });
  });

  if (workspace.boards.length === 0) {
    addIssue({
      severity: "danger",
      scope: "workspace",
      title: "Нет проектов",
      description: "Workspace должен содержать хотя бы один проект.",
    });
  }

  if (
    workspace.activeBoardId &&
    !workspace.boards.some((board) => board.id === workspace.activeBoardId)
  ) {
    addIssue({
      severity: "warning",
      scope: "workspace",
      title: "Активный проект не найден",
      description: `activeBoardId указывает на ${workspace.activeBoardId}, но такого проекта нет в workspace.`,
      boardId: workspace.activeBoardId,
    });
  }

  workspace.boards.forEach((board) => {
    const schemaResult = boardSchema.safeParse(board);

    if (!schemaResult.success) {
      const messages = schemaResult.error.issues
        .slice(0, 5)
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join(".") : "board";
          return `${path}: ${issue.message}`;
        })
        .join("; ");
      const hiddenCount = Math.max(schemaResult.error.issues.length - 5, 0);

      addIssue({
        severity: "danger",
        scope: "backup",
        title: `Схема проекта ${getBoardLabel(board, board.id)} невалидна`,
        description: hiddenCount
          ? `${messages}; ещё ${hiddenCount} проблем.`
          : messages,
        boardId: board.id,
      });
    }

    const cardOwners = new Map<string, string[]>();

    board.listIds.forEach((listId) => {
      const list = board.lists[listId];

      if (!list) {
        return;
      }

      list.cardIds.forEach((cardId) => {
        cardOwners.set(cardId, [...(cardOwners.get(cardId) ?? []), listId]);
      });
    });

    Object.values(board.cards).forEach((card) => {
      const list = board.lists[card.listId];
      const ownerListIds = cardOwners.get(card.id) ?? [];

      if (!list) {
        addIssue({
          severity: "danger",
          scope: "board",
          title: "Карточка ссылается на удалённый список",
          description: `Карточка «${card.title}» в проекте ${getBoardLabel(board, board.id)} указывает на список ${card.listId}.`,
          boardId: board.id,
        });
      }

      if (!card.isArchived && ownerListIds.length === 0) {
        addIssue({
          severity: "danger",
          scope: "board",
          title: "Активная карточка отсутствует в списках",
          description: `Карточка «${card.title}» не архивная, но её нет ни в одном list.cardIds.`,
          boardId: board.id,
        });
      }

      if (ownerListIds.length > 1) {
        addIssue({
          severity: "danger",
          scope: "board",
          title: "Карточка находится в нескольких списках",
          description: `Карточка «${card.title}» встречается в ${ownerListIds.length} списках.`,
          boardId: board.id,
        });
      }
    });
  });
}

function collectNotesIssues(
  workspace: BoardWorkspace,
  notes: readonly Note[],
  addIssue: (issue: Omit<WorkspaceHealthIssue, "id">) => void,
) {
  const boardById = new Map(workspace.boards.map((board) => [board.id, board]));
  const duplicateNoteIds = collectDuplicateIds(notes.map((note) => note.id));

  duplicateNoteIds.forEach((noteId) => {
    addIssue({
      severity: "danger",
      scope: "notes",
      title: "Повторяется id заметки",
      description: `Несколько заметок используют id ${noteId}.`,
      noteId,
    });
  });

  notes.forEach((note) => {
    const blockById = getBlockMap(note.blocks);
    const duplicateBlockIds = collectDuplicateIds(
      note.blocks.map((block) => block.id),
    );

    if (note.boardId && !boardById.has(note.boardId)) {
      addIssue({
        severity: "warning",
        scope: "notes",
        title: "Заметка привязана к удалённому проекту",
        description: `Заметка «${note.title}» указывает на проект ${note.boardId}, которого нет в workspace.`,
        noteId: note.id,
      });
    }

    duplicateBlockIds.forEach((blockId) => {
      addIssue({
        severity: "danger",
        scope: "notes",
        title: "Повторяется id блока заметки",
        description: `В заметке «${note.title}» несколько блоков используют id ${blockId}.`,
        noteId: note.id,
      });
    });

    note.blocks.forEach((block) => {
      if (block.parentId && !blockById.has(block.parentId)) {
        addIssue({
          severity: "danger",
          scope: "notes",
          title: "Блок вложен в несуществующий parent",
          description: `В заметке «${note.title}» блок ${block.id} указывает на parent ${block.parentId}.`,
          noteId: note.id,
        });
      }

      if (block.parentId && hasParentCycle(block, blockById)) {
        addIssue({
          severity: "danger",
          scope: "notes",
          title: "Циклическая вложенность блока",
          description: `В заметке «${note.title}» блок ${block.id} образует цикл вложенности.`,
          noteId: note.id,
        });
      }

      if (block.type === "table" && block.tableCells) {
        const columnCounts = block.tableCells.map((row) => row.length);
        const firstColumnCount = columnCounts[0] ?? 0;
        const hasUnevenRows = columnCounts.some(
          (columnCount) => columnCount !== firstColumnCount,
        );

        if (block.tableCells.length === 0 || firstColumnCount === 0) {
          addIssue({
            severity: "warning",
            scope: "notes",
            title: "Пустая таблица в заметке",
            description: `В заметке «${note.title}» есть table-блок без ячеек.`,
            noteId: note.id,
          });
        }

        if (hasUnevenRows) {
          addIssue({
            severity: "danger",
            scope: "notes",
            title: "Неровная таблица в заметке",
            description: `В заметке «${note.title}» строки таблицы имеют разное количество колонок.`,
            noteId: note.id,
          });
        }
      }

      if (block.type === "linked-card") {
        const linkedBoardId = block.linkedBoardId ?? note.boardId;
        const linkedBoard = linkedBoardId ? boardById.get(linkedBoardId) : undefined;
        const linkedCard = block.linkedCardId
          ? linkedBoard?.cards[block.linkedCardId]
          : undefined;

        if (!linkedBoardId || !block.linkedCardId) {
          addIssue({
            severity: "warning",
            scope: "links",
            title: "Неполная связь заметки с задачей",
            description: `В заметке «${note.title}» linked-card блок не содержит boardId или cardId.`,
            noteId: note.id,
          });
          return;
        }

        if (!linkedBoard) {
          addIssue({
            severity: "danger",
            scope: "links",
            title: "Связь ведёт в удалённый проект",
            description: `В заметке «${note.title}» linked-card указывает на проект ${linkedBoardId}.`,
            noteId: note.id,
            boardId: linkedBoardId,
          });
          return;
        }

        if (!linkedCard) {
          addIssue({
            severity: "danger",
            scope: "links",
            title: "Связанная задача не найдена",
            description: `В заметке «${note.title}» ссылка ведёт на карточку ${block.linkedCardId} в проекте ${getBoardLabel(linkedBoard, linkedBoard.id)}.`,
            noteId: note.id,
            boardId: linkedBoard.id,
          });
          return;
        }

        if (linkedCard.isArchived) {
          addIssue({
            severity: "warning",
            scope: "links",
            title: "Связанная задача архивирована",
            description: `Заметка «${note.title}» связана с архивной карточкой «${linkedCard.title}».`,
            noteId: note.id,
            boardId: linkedBoard.id,
          });
        }
      }
    });
  });
}

export function evaluateWorkspaceHealth({
  notes,
  workspace,
}: EvaluateWorkspaceHealthOptions): WorkspaceHealthReport {
  const issues: WorkspaceHealthIssue[] = [];

  const addIssue = (issue: Omit<WorkspaceHealthIssue, "id">) => {
    issues.push(createIssue(issues.length + 1, issue));
  };

  collectBoardIssues(workspace, addIssue);
  collectNotesIssues(workspace, notes, addIssue);

  const dangerCount = issues.filter((issue) => issue.severity === "danger").length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  return {
    activeCardsCount: getActiveCardsCount(workspace),
    boardsCount: workspace.boards.length,
    checkedAt: Date.now(),
    dangerCount,
    issues,
    notesCount: notes.length,
    warningCount,
  };
}
