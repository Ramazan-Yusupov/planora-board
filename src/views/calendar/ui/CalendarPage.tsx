"use client";

import { AlertTriangle, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import {
  DEFAULT_CALENDAR_CARD_FILTERS,
  type CalendarCardFilters,
} from "@/features/filter-cards";
import { type BoardCard, type CardDraft } from "@/entities/board";
import { updateCard } from "@/features/board-management";
import {
  getWorkspacePersistenceLabel,
  useBoardWorkspace,
} from "@/features/manage-board-workspace";
import { loadNotes, type Note } from "@/features/manage-notes";
import {
  getCalendarItems,
  getMonthStart,
  shiftMonth,
  type CalendarItem,
} from "@/features/view-calendar";
import { buildTaskReviewReport, getTaskReviewIssueCount } from "@/features/task-review";
import {
  ANALYTICS_ROUTE,
  CALENDAR_ROUTE,
  DRAW_ROUTE,
  MY_WORK_ROUTE,
  NOTES_ROUTE,
  TASK_REVIEW_ROUTE,
  getBoardRoute,
} from "@/shared/config/routes";
import { usePrefetchRoutes } from "@/shared/lib";
import { Text } from "@/shared/ui";
import { CalendarView } from "@/widgets/calendar-view";
import {
  CommandPalette,
  getWorkspaceSearchActions,
} from "@/widgets/command-palette";
import { getWorkspaceNavigationActions } from "@/widgets/command-palette/lib/getWorkspaceNavigationActions";
import { useCommandPaletteShortcut } from "@/widgets/command-palette/lib/useCommandPaletteShortcut";
import { ProjectSwitcher } from "@/widgets/project-switcher";
import { WorkspaceHeader } from "@/widgets/workspace-header";

function subscribeToCurrentMonth() {
  return () => undefined;
}

function getCurrentMonthTimestamp(): number {
  return getMonthStart(new Date()).getTime();
}

function getServerMonthTimestamp(): number {
  return 0;
}

function CalendarLoadingState() {
  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
      <Text
        aria-busy="true"
        aria-live="polite"
        text="Загружаем календарь…"
        variant="loading"
      />
    </main>
  );
}

function createCardDraftWithDueDate(
  card: BoardCard,
  dueDate: string,
): CardDraft {
  return {
    title: card.title,
    description: card.description,
    status: card.status,
    priority: card.priority,
    startDate: card.startDate,
    dueDate,
    labelIds: [...card.labelIds],
    customFields: card.customFields.map((field) => ({ ...field })),
    sticker: card.sticker,
    cover: card.cover,
  };
}

export function CalendarPage() {
  const router = useRouter();
  const {
    workspace,
    activeBoard,
    isReady,
    persistenceState,
    storageError,
    workspaceStorage,
    createProject,
    deleteProject,
    selectProject,
    updateBoard,
  } = useBoardWorkspace();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [calendarFilters, setCalendarFilters] = useState<CalendarCardFilters>({
    ...DEFAULT_CALENDAR_CARD_FILTERS,
  });
  const [monthOffset, setMonthOffset] = useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notesSnapshot, setNotesSnapshot] = useState<Note[]>([]);
  const openCommandPalette = useCallback(() => {
    setNotesSnapshot(loadNotes());
    setIsCommandPaletteOpen(true);
  }, []);
  useCommandPaletteShortcut(openCommandPalette);
  const currentMonthTimestamp = useSyncExternalStore(
    subscribeToCurrentMonth,
    getCurrentMonthTimestamp,
    getServerMonthTimestamp,
  );
  const month = shiftMonth(new Date(currentMonthTimestamp), monthOffset);
  const taskReviewIssuesCount = useMemo(
    () => (workspace ? getTaskReviewIssueCount(buildTaskReviewReport(workspace)) : 0),
    [workspace],
  );
  usePrefetchRoutes([
    activeBoard ? getBoardRoute(activeBoard.id) : null,
    NOTES_ROUTE,
    CALENDAR_ROUTE,
    DRAW_ROUTE,
    MY_WORK_ROUTE,
    ANALYTICS_ROUTE,
    TASK_REVIEW_ROUTE,
  ]);

  if (!isReady || !workspace || !activeBoard) {
    return <CalendarLoadingState />;
  }

  const selectedCalendarBoardId = selectedBoardId ?? activeBoard.id;

  const persistenceLabel = getWorkspacePersistenceLabel({
    persistenceState,
    workspaceStorage,
  });

  const openBoard = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
    router.push(getBoardRoute(boardId));
  };
  const selectProjectFromHeader = (boardId: string) => {
    selectProject(boardId);
    setSelectedBoardId(boardId);
    setIsProjectsOpen(false);
  };
  const createProjectFromHeader = (title: string, templateId?: Parameters<typeof createProject>[1]) => {
    const createdBoardId = createProject(title, templateId);

    if (createdBoardId) {
      selectProjectFromHeader(createdBoardId);
    }
  };
  const deleteProjectFromHeader = (boardId: string) => {
    const nextActiveBoardId = deleteProject(boardId);

    if (selectedBoardId === boardId) {
      setSelectedBoardId(nextActiveBoardId);
    }
  };
  const openCalendarCard = (item: CalendarItem) => {
    selectProject(item.boardId);
    router.push(getBoardRoute(item.boardId, item.card.id));
  };
  const openWorkspaceCard = (boardId: string, cardId: string) => {
    selectProject(boardId);
    router.push(getBoardRoute(boardId, cardId));
  };
  const openWorkspaceNote = (note: Note) => {
    if (note.boardId) {
      selectProject(note.boardId);
    }

    router.push(`${NOTES_ROUTE}?note=${encodeURIComponent(note.id)}`);
  };
  const calendarTaskActions = Array.from(
    getCalendarItems(workspace.boards, selectedCalendarBoardId).entries(),
  ).flatMap(([dateKey, items]) =>
    items.map((item) => ({
      id: `calendar-card-${item.boardId}-${item.card.id}`,
      label: item.card.title,
      description: `${item.boardTitle} · ${dateKey}`,
      icon: <CalendarDays aria-hidden="true" size={18} />,
      onSelect: () => openCalendarCard(item),
    })),
  );
  const commandActions = [
    ...getWorkspaceNavigationActions({
      onOpenAnalytics: () => router.push(ANALYTICS_ROUTE),
      onOpenBoard: () => openBoard(activeBoard.id),
      onOpenCalendar: () => router.push(CALENDAR_ROUTE),
      onOpenDraw: () => router.push(DRAW_ROUTE),
      onOpenMyWork: () => router.push(MY_WORK_ROUTE),
      onOpenNotes: () => router.push(NOTES_ROUTE),
      onOpenTaskReview: () => router.push(TASK_REVIEW_ROUTE),
    }),
    ...calendarTaskActions,
    ...getWorkspaceSearchActions({
      activeBoardId: activeBoard.id,
      notes: notesSnapshot,
      workspace,
      onOpenBoard: openBoard,
      onOpenCard: openWorkspaceCard,
      onOpenNote: openWorkspaceNote,
    }),
  ];

  const selectCalendarBoard = (boardId: string | null) => {
    if (boardId) {
      selectProject(boardId);
    }

    setSelectedBoardId(boardId);
  };
  const moveCalendarCardDate = (item: CalendarItem, dateKey: string) => {
    updateBoard(
      item.boardId,
      (board) => {
        const card = board.cards[item.card.id];

        if (!card) {
          return board;
        }

        return updateCard(board, item.card.id, createCardDraftWithDueDate(card, dateKey));
      },
      "immediate",
    );
  };

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="calendar"
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        persistenceLabel={persistenceLabel}
        taskReviewIssuesCount={taskReviewIssuesCount}
        onOpenAnalytics={() => router.push(ANALYTICS_ROUTE)}
        onOpenBoard={() => openBoard(activeBoard.id)}
        onOpenCalendar={() => router.push(CALENDAR_ROUTE)}
        onOpenCommands={openCommandPalette}
        onOpenDraw={() => router.push(DRAW_ROUTE)}
        onOpenMyWork={() => router.push(MY_WORK_ROUTE)}
        onOpenNotes={() => router.push(NOTES_ROUTE)}
        onOpenTaskReview={() => router.push(TASK_REVIEW_ROUTE)}
        showProjectsButton={false}
        onToggleProjects={() => setIsProjectsOpen((current) => !current)}
      >
        <ProjectSwitcher
          activeBoard={activeBoard}
          boards={workspace.boards}
          isOpen={isProjectsOpen}
          onCreateBoard={createProjectFromHeader}
          onDeleteBoard={deleteProjectFromHeader}
          onOpenChange={setIsProjectsOpen}
          onSelectBoard={selectProjectFromHeader}
        />
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <section className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden">
          {storageError ? (
            <div className="border-b border-amber-300/35 bg-amber-950/70 px-4 py-3 text-amber-100 sm:px-6">
              <div className="mx-auto flex max-w-[1800px] items-start gap-2 text-sm leading-5">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={17}
                />
                <Text text={storageError} />
              </div>
            </div>
          ) : null}

          <CalendarView
            boards={workspace.boards}
            filters={calendarFilters}
            month={month}
            selectedBoardId={selectedCalendarBoardId}
            onChangeFilters={setCalendarFilters}
            onMoveCardDate={moveCalendarCardDate}
            onOpenCard={openCalendarCard}
            onSelectBoard={selectCalendarBoard}
            onShiftMonth={(offset) =>
              setMonthOffset((current) => current + offset)
            }
            onShowToday={() => setMonthOffset(0)}
          />
        </section>
      </div>
      {isCommandPaletteOpen ? (
        <CommandPalette
          actions={commandActions}
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      ) : null}
    </main>
  );
}
