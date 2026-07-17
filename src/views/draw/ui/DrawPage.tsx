"use client";

import { AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  getWorkspacePersistenceLabel,
  useBoardWorkspace,
} from "@/features/manage-board-workspace";
import {
  buildTaskReviewReport,
  getTaskReviewIssueCount,
} from "@/features/task-review";
import { AppProviders as DrawToolProviders } from "@/modules/draw-tool/app/providers/AppProviders";
import {
  PlanoraAdapterProvider,
  PlanoraTaskSync,
  type PlanoraTaskItem,
} from "@/modules/draw-tool/planora-adapter";
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
import { ProjectSwitcher } from "@/widgets/project-switcher";
import { WorkspaceHeader } from "@/widgets/workspace-header";

const DrawToolBoardPage = dynamic(
  () =>
    import("@/modules/draw-tool/pages/board").then((mod) => mod.BoardPage),
  {
    ssr: false,
    loading: () => <DrawLoadingState />,
  },
);

function DrawLoadingState() {
  return (
    <div className="grid size-full place-items-center bg-canvas px-4 text-text">
      <p
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
      >
        Загружаем DrawTool...
      </p>
    </div>
  );
}

export function DrawPage() {
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
  } = useBoardWorkspace();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const taskReviewIssuesCount = useMemo(
    () =>
      workspace ? getTaskReviewIssueCount(buildTaskReviewReport(workspace)) : 0,
    [workspace],
  );

  usePrefetchRoutes([
    activeBoard ? getBoardRoute(activeBoard.id) : null,
    NOTES_ROUTE,
    CALENDAR_ROUTE,
    DRAW_ROUTE,
    MY_WORK_ROUTE,
    ANALYTICS_ROUTE,
  ]);
  const planoraTasks = useMemo<PlanoraTaskItem[]>(() => {
    if (!activeBoard) {
      return [];
    }

    return Object.values(activeBoard.cards)
      .filter((card) => {
        const list = activeBoard.lists[card.listId];

        return !card.isArchived && list && !list.isArchived;
      })
      .map((card) => {
        const list = activeBoard.lists[card.listId];
        const statusLabel =
          activeBoard.cardStatusLabels[card.status] ||
          activeBoard.cardStatuses.find((status) => status.id === card.status)
            ?.name;
        const priorityLabel =
          activeBoard.cardPriorityLabels[card.priority] ||
          activeBoard.cardPriorities.find(
            (priority) => priority.id === card.priority,
          )?.name;

        return {
          id: card.id,
          boardId: activeBoard.id,
          boardTitle: activeBoard.title,
          listId: card.listId,
          listTitle: list?.title ?? "Список",
          title: card.title,
          statusLabel: statusLabel === "Без статуса" ? undefined : statusLabel,
          priorityLabel:
            priorityLabel === "Без приоритета" ? undefined : priorityLabel,
          dueDate: card.dueDate,
        };
      })
      .sort((firstTask, secondTask) =>
        firstTask.title.localeCompare(secondTask.title, "ru-RU"),
      );
  }, [activeBoard]);

  if (!isReady || !workspace || !activeBoard) {
    return (
      <main className="grid h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
        <DrawLoadingState />
      </main>
    );
  }

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
    setIsProjectsOpen(false);
  };
  const createProjectFromHeader = (
    title: string,
    templateId?: Parameters<typeof createProject>[1],
  ) => {
    const createdBoardId = createProject(title, templateId);

    if (createdBoardId) {
      selectProjectFromHeader(createdBoardId);
    }
  };

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="draw"
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        persistenceLabel={persistenceLabel}
        taskReviewIssuesCount={taskReviewIssuesCount}
        onOpenAnalytics={() => router.push(ANALYTICS_ROUTE)}
        onOpenBoard={() => openBoard(activeBoard.id)}
        onOpenCalendar={() => router.push(CALENDAR_ROUTE)}
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
          onDeleteBoard={deleteProject}
          onOpenChange={setIsProjectsOpen}
          onSelectBoard={selectProjectFromHeader}
        />
      </WorkspaceHeader>

      {storageError ? (
        <div className="border-b border-amber-300/35 bg-amber-950/70 px-4 py-3 text-amber-100 sm:px-6">
          <div className="mx-auto flex max-w-[1800px] items-start gap-2 text-sm leading-5">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            <span>{storageError}</span>
          </div>
        </div>
      ) : null}

      <section className="drawtool-root min-h-0 flex-1 overflow-hidden">
        <PlanoraAdapterProvider
          tasks={planoraTasks}
          onOpenTask={(task) => router.push(getBoardRoute(task.boardId, task.id))}
        >
          <PlanoraTaskSync />
          <DrawToolProviders>
            <DrawToolBoardPage />
          </DrawToolProviders>
        </PlanoraAdapterProvider>
      </section>
    </main>
  );
}
