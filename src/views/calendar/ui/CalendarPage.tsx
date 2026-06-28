"use client";

import { AlertTriangle } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import {
  DEFAULT_CALENDAR_CARD_FILTERS,
  type CalendarCardFilters,
} from "@/features/filter-cards";
import { useBoardWorkspace } from "@/features/manage-board-workspace";
import { getMonthStart, shiftMonth, type CalendarItem } from "@/features/view-calendar";
import { CALENDAR_ROUTE, getBoardRoute } from "@/shared/config/routes";
import { CalendarView } from "@/widgets/calendar-view";
import { ProjectSidebar } from "@/widgets/project-sidebar";
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
      <p
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
      >
        Загружаем календарь…
      </p>
    </main>
  );
}

export function CalendarPage() {
  const router = useRouter();
  const {
    workspace,
    activeBoard,
    isReady,
    persistenceState,
    storageError,
    createProject,
    deleteProject,
    selectProject,
  } = useBoardWorkspace();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [calendarFilters, setCalendarFilters] = useState<CalendarCardFilters>({
    ...DEFAULT_CALENDAR_CARD_FILTERS,
  });
  const [monthOffset, setMonthOffset] = useState(0);
  const currentMonthTimestamp = useSyncExternalStore(
    subscribeToCurrentMonth,
    getCurrentMonthTimestamp,
    getServerMonthTimestamp,
  );
  const month = shiftMonth(new Date(currentMonthTimestamp), monthOffset);

  if (!isReady || !workspace || !activeBoard) {
    return <CalendarLoadingState />;
  }

  const statusLabel =
    persistenceState === "saving"
      ? "Сохраняем…"
      : persistenceState === "error"
        ? "Ошибка сохранения"
        : "Сохранено локально";

  const openBoard = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
    router.push(getBoardRoute(boardId));
  };

  const openCalendarCard = (item: CalendarItem) => {
    selectProject(item.boardId);
    router.push(getBoardRoute(item.boardId, item.card.id));
  };

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="calendar"
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        persistenceLabel={statusLabel}
        onOpenBoard={() => openBoard(activeBoard.id)}
        onOpenCalendar={() => router.push(CALENDAR_ROUTE)}
        onToggleProjects={() => setIsProjectsOpen((current) => !current)}
      >
        <div className="px-2 py-2 sm:px-3">
          <h1 className="text-base font-semibold text-text sm:text-lg">Календарь</h1>
          <p className="hidden text-xs text-text-muted sm:block">
            Задачи с установленным сроком
          </p>
        </div>
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isProjectsOpen ? (
          <button
            aria-label="Закрыть проекты"
            className="absolute inset-0 z-30 bg-black/55 lg:hidden"
            type="button"
            onClick={() => setIsProjectsOpen(false)}
          />
        ) : null}

        <ProjectSidebar
          activeBoardId={workspace.activeBoardId}
          boards={workspace.boards}
          isOpen={isProjectsOpen}
          onClose={() => setIsProjectsOpen(false)}
          onCreateBoard={(title) => {
            const createdBoardId = createProject(title);

            if (createdBoardId) {
              router.push(getBoardRoute(createdBoardId));
            }
          }}
          onDeleteBoard={(boardId) => {
            deleteProject(boardId);

            if (selectedBoardId === boardId) {
              setSelectedBoardId(null);
            }
          }}
          onSelectBoard={openBoard}
        />

        <section className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden">
          {storageError ? (
            <div className="border-b border-amber-300/35 bg-amber-950/70 px-4 py-3 text-amber-100 sm:px-6">
              <div className="mx-auto flex max-w-[1800px] items-start gap-2 text-sm leading-5">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={17}
                />
                <p>{storageError}</p>
              </div>
            </div>
          ) : null}

          <CalendarView
            boards={workspace.boards}
            filters={calendarFilters}
            month={month}
            selectedBoardId={selectedBoardId}
            onChangeFilters={setCalendarFilters}
            onOpenCard={openCalendarCard}
            onSelectBoard={setSelectedBoardId}
            onShiftMonth={(offset) => setMonthOffset((current) => current + offset)}
            onShowToday={() => setMonthOffset(0)}
          />
        </section>
      </div>
    </main>
  );
}
