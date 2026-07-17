import type { Board, BoardCard, BoardList } from "@/entities/board";
import type { Note } from "@/features/manage-notes";
import type { WorkspaceHealthReport } from "@/features/workspace-health";

export type WorkspacePreflightTone = "danger" | "warning" | "success" | "info";

export type WorkspacePreflightItem = Readonly<{
  id: string;
  title: string;
  description: string;
  tone: WorkspacePreflightTone;
  count?: number;
}>;

export type WorkspacePreflightSection = Readonly<{
  id: "backup" | "delete-project" | "bulk-actions" | "notes";
  title: string;
  description: string;
  items: WorkspacePreflightItem[];
}>;

export type WorkspacePreflightReport = Readonly<{
  dangerCount: number;
  sections: WorkspacePreflightSection[];
  totalSignals: number;
  warningCount: number;
}>;

type BuildWorkspacePreflightReportOptions = Readonly<{
  activeBoard: Board;
  healthReport: WorkspaceHealthReport;
  notes: readonly Note[];
}>;

function getActiveLists(board: Board): BoardList[] {
  return board.listIds.flatMap((listId) => {
    const list = board.lists[listId];

    return list && !list.isArchived ? [list] : [];
  });
}

function getActiveCards(board: Board): BoardCard[] {
  return Object.values(board.cards).filter((card) => {
    const list = board.lists[card.listId];

    return !card.isArchived && list && !list.isArchived;
  });
}

function getBoardNotes(notes: readonly Note[], boardId: string): Note[] {
  return notes.filter((note) => note.boardId === boardId);
}

function getLinkedNotes(notes: readonly Note[], boardId: string): Note[] {
  return notes.filter((note) =>
    note.blocks.some(
      (block) =>
        block.type === "linked-card" &&
        (!block.linkedBoardId || block.linkedBoardId === boardId) &&
        Boolean(block.linkedCardId),
    ),
  );
}

function countWipRisks(lists: readonly BoardList[]): number {
  return lists.filter(
    (list) => list.wipLimit !== undefined && list.cardIds.length > list.wipLimit,
  ).length;
}

function countBlockedOrOverdueCards(cards: readonly BoardCard[]): number {
  const today = new Date().toISOString().slice(0, 10);

  return cards.filter(
    (card) =>
      card.status === "blocked" || Boolean(card.dueDate && card.dueDate < today),
  ).length;
}

function countSignals(items: readonly WorkspacePreflightItem[]): {
  dangerCount: number;
  warningCount: number;
} {
  return items.reduce(
    (counts, item) => ({
      dangerCount: counts.dangerCount + (item.tone === "danger" ? 1 : 0),
      warningCount: counts.warningCount + (item.tone === "warning" ? 1 : 0),
    }),
    { dangerCount: 0, warningCount: 0 },
  );
}

export function buildWorkspacePreflightReport({
  activeBoard,
  healthReport,
  notes,
}: BuildWorkspacePreflightReportOptions): WorkspacePreflightReport {
  const activeLists = getActiveLists(activeBoard);
  const activeCards = getActiveCards(activeBoard);
  const boardNotes = getBoardNotes(notes, activeBoard.id);
  const linkedNotes = getLinkedNotes(notes, activeBoard.id);
  const wipRisksCount = countWipRisks(activeLists);
  const blockedOrOverdueCount = countBlockedOrOverdueCards(activeCards);
  const backupItems: WorkspacePreflightItem[] = [
    {
      id: "health",
      title: "Health Check перед import/backup",
      description:
        healthReport.issues.length > 0
          ? "Перед импортом или backup стоит открыть диагностику и разобрать найденные сигналы."
          : "Схема workspace и связи выглядят готовыми к backup/import.",
      tone:
        healthReport.dangerCount > 0
          ? "danger"
          : healthReport.warningCount > 0
            ? "warning"
            : "success",
      count: healthReport.issues.length,
    },
    {
      id: "backup-scope",
      title: "Состав backup",
      description: `${activeBoard.title}: ${activeLists.length} списков, ${activeCards.length} активных карточек, ${boardNotes.length} заметок проекта.`,
      tone: "info",
    },
  ];
  const deleteProjectItems: WorkspacePreflightItem[] = [
    {
      id: "delete-cards",
      title: "Удаление текущего проекта",
      description:
        activeCards.length > 0
          ? "Перед удалением проекта нужен свежий backup: в проекте есть активные карточки."
          : "В текущем проекте нет активных карточек.",
      tone: activeCards.length > 0 ? "warning" : "success",
      count: activeCards.length,
    },
    {
      id: "delete-notes",
      title: "Связанные заметки",
      description:
        boardNotes.length + linkedNotes.length > 0
          ? "Удаление проекта оставит заметки без контекста или со ссылками на архивные/удалённые задачи."
          : "Заметок, явно связанных с проектом, не найдено.",
      tone: boardNotes.length + linkedNotes.length > 0 ? "warning" : "success",
      count: boardNotes.length + linkedNotes.length,
    },
  ];
  const bulkItems: WorkspacePreflightItem[] = [
    {
      id: "bulk-wip",
      title: "WIP limits",
      description:
        wipRisksCount > 0
          ? "Есть списки, где количество карточек выше WIP limit. Массовые переносы могут усилить перегруз."
          : "Активные списки не превышают WIP limit.",
      tone: wipRisksCount > 0 ? "warning" : "success",
      count: wipRisksCount,
    },
    {
      id: "bulk-risk-cards",
      title: "Рискованные карточки",
      description:
        blockedOrOverdueCount > 0
          ? "Перед массовым переносом проверь blocked и просроченные карточки."
          : "Blocked и просроченных активных карточек для массовых операций не найдено.",
      tone: blockedOrOverdueCount > 0 ? "warning" : "success",
      count: blockedOrOverdueCount,
    },
  ];
  const notesItems: WorkspacePreflightItem[] = [
    {
      id: "notes-links",
      title: "Notes links",
      description:
        linkedNotes.length > 0
          ? "В Notes есть linked-card блоки. Перед import/delete проверь, что связи сохранятся."
          : "Связанные с карточками блоки Notes для текущего проекта не найдены.",
      tone: linkedNotes.length > 0 ? "info" : "success",
      count: linkedNotes.length,
    },
  ];
  const sections: WorkspacePreflightSection[] = [
    {
      id: "backup",
      title: "Перед import / backup",
      description: "Проверка целостности данных и состава текущего backup.",
      items: backupItems,
    },
    {
      id: "delete-project",
      title: "Перед удалением проекта",
      description: "Что может потерять контекст, если удалить текущую доску.",
      items: deleteProjectItems,
    },
    {
      id: "bulk-actions",
      title: "Перед массовыми действиями",
      description: "Сигналы для очистки списков, массового переноса и архивирования.",
      items: bulkItems,
    },
    {
      id: "notes",
      title: "Перед изменением Notes",
      description: "Связи заметок с доской и карточками.",
      items: notesItems,
    },
  ];
  const allItems = sections.flatMap((section) => section.items);
  const { dangerCount, warningCount } = countSignals(allItems);

  return {
    dangerCount,
    sections,
    totalSignals: dangerCount + warningCount,
    warningCount,
  };
}
