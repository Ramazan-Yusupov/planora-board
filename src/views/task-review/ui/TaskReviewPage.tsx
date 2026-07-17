"use client";

import {
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  ListChecks,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  buildTaskReviewReport,
  getTaskReviewIssueCount,
  type TaskReviewBoardSummary,
  type TaskReviewItem,
  type TaskReviewSection,
  type TaskReviewTone,
} from "@/features/task-review";
import {
  getWorkspacePersistenceLabel,
  useBoardWorkspace,
} from "@/features/manage-board-workspace";
import { loadNotes, type Note } from "@/features/manage-notes";
import {
  ANALYTICS_ROUTE,
  CALENDAR_ROUTE,
  DRAW_ROUTE,
  MY_WORK_ROUTE,
  NOTES_ROUTE,
  TASK_REVIEW_ROUTE,
  getBoardRoute,
} from "@/shared/config/routes";
import { cn, usePrefetchRoutes } from "@/shared/lib";
import {
  CommandPalette,
  getWorkspaceSearchActions,
} from "@/widgets/command-palette";
import { getWorkspaceNavigationActions } from "@/widgets/command-palette/lib/getWorkspaceNavigationActions";
import { useCommandPaletteShortcut } from "@/widgets/command-palette/lib/useCommandPaletteShortcut";
import { ProjectSwitcher } from "@/widgets/project-switcher";
import { Box, Flex, Grid, Inline, Stack, Surface, Text, Title } from "@/shared/ui";
import { WorkspaceHeader } from "@/widgets/workspace-header";

function TaskReviewLoadingState() {
  return (
    <Grid tag="main" className="h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
      <Text
        aria-busy="true"
        aria-live="polite"
        text="Проверяем задачи…"
        variant="loading"
      />
    </Grid>
  );
}

function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

function formatDueDate(dateKey: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function getToneClass(tone: TaskReviewTone): string {
  return cn(
    tone === "danger" && "border-red-300/20 bg-red-500/10 text-red-100",
    tone === "warning" && "border-amber-300/20 bg-amber-400/10 text-amber-100",
    tone === "info" && "border-sky-300/20 bg-sky-400/10 text-sky-100",
    tone === "muted" && "border-white/10 bg-white/6 text-text-muted",
  );
}

function MetricCard({
  detail,
  icon,
  label,
  tone,
  value,
}: Readonly<{
  detail: string;
  icon: ReactNode;
  label: string;
  tone: TaskReviewTone;
  value: number;
}>) {
  return (
    <Surface className="p-4">
      <Flex className="items-start justify-between gap-3">
        <Box className="min-w-0">
          <Text
            text={label}
            variant="eyebrow"
          />
          <Text
            className="mt-3"
            text={value}
            variant="stat"
          />
        </Box>
        <Box
          tag="span"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg border",
            getToneClass(tone),
          )}
        >
          {icon}
        </Box>
      </Flex>
      <Text className="mt-2" text={detail} variant="muted" />
    </Surface>
  );
}

function ReviewItemCard({
  item,
  onOpen,
}: Readonly<{
  item: TaskReviewItem;
  onOpen: (item: TaskReviewItem) => void;
}>) {
  return (
    <button
      className="w-full rounded-lg border border-white/10 bg-control/28 p-3 text-left transition hover:border-accent/45 hover:bg-control/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      type="button"
      onClick={() => onOpen(item)}
    >
      <Flex className="min-w-0 items-start gap-3">
        <Box
          tag="span"
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-panel/75 text-text-muted"
        >
          <FolderKanban aria-hidden="true" size={16} />
        </Box>
        <Box className="min-w-0 flex-1">
          <Text
            className="truncate"
            text={item.cardTitle}
            variant="itemTitle"
          />
          <Text
            className="mt-1 truncate"
            text={`${item.boardTitle} / ${item.listTitle}`}
            variant="caption"
          />
        </Box>
      </Flex>

      <Inline className="mt-3 flex-wrap gap-1.5">
        {item.dueDate ? (
          <Inline
            tag="span"
            className="min-h-7 gap-1 rounded-md border border-white/10 bg-black/12 px-2 text-[11px] font-semibold tabular-nums text-text"
          >
            <CalendarDays aria-hidden="true" size={13} />
            <Text tag="span" text={formatDueDate(item.dueDate)} />
          </Inline>
        ) : null}
        <Inline
          tag="span"
          className="min-h-7 max-w-full rounded-md border border-white/10 bg-black/12 px-2 text-[11px] font-medium text-text-muted"
        >
            <Text
              tag="span"
              className="max-w-24 truncate"
              text={item.status}
            />
        </Inline>
        <Inline
          tag="span"
          className="min-h-7 max-w-full rounded-md border border-white/10 bg-black/12 px-2 text-[11px] font-medium text-text-muted"
        >
            <Text
              tag="span"
              className="max-w-24 truncate"
              text={item.priority}
            />
        </Inline>
      </Inline>
    </button>
  );
}

function ReviewSectionCard({
  section,
  onOpen,
}: Readonly<{
  section: TaskReviewSection;
  onOpen: (item: TaskReviewItem) => void;
}>) {
  const visibleItems = section.items.slice(0, 6);
  const hiddenCount = Math.max(section.items.length - visibleItems.length, 0);

  return (
    <Surface className="min-w-0 p-4">
      <Flex
        tag="header"
        className="items-start justify-between gap-3 border-b border-white/10 pb-3"
      >
        <Box className="min-w-0">
          <Inline className="gap-2">
            <Box
              tag="span"
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg border",
                getToneClass(section.tone),
              )}
            >
              <ShieldAlert aria-hidden="true" size={15} />
            </Box>
            <Title
              tag="h2"
              title={section.title}
              variant="compact"
            />
          </Inline>
          <Text
            className="mt-2"
            text={section.description}
            variant="caption"
          />
        </Box>
        <Box
          tag="span"
          className="rounded-md bg-control px-2 py-1 text-xs font-semibold tabular-nums text-text-muted"
        >
          <Text tag="span" text={section.items.length} />
        </Box>
      </Flex>

      <Grid className="mt-3 gap-2">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <ReviewItemCard key={item.id} item={item} onOpen={onOpen} />
          ))
        ) : (
          <Text
            className="grid min-h-24 place-items-center rounded-lg border border-dashed border-white/14 bg-control/18 px-3 text-center text-xs leading-5 text-text-muted"
            text={section.emptyText}
          />
        )}
      </Grid>

      {hiddenCount > 0 ? (
        <Text
          className="mt-3 font-medium"
          text={`Ещё ${hiddenCount} задач в этой группе.`}
          variant="caption"
        />
      ) : null}
    </Surface>
  );
}

function BoardSummaryRow({
  board,
  onOpen,
}: Readonly<{
  board: TaskReviewBoardSummary;
  onOpen: (boardId: string) => void;
}>) {
  const riskCount =
    board.overdueCards +
    board.blockedCards +
    board.noDueDateCards +
    board.staleCards +
    board.overloadedLists;

  return (
    <button
      className="grid w-full gap-3 rounded-lg border border-white/10 bg-control/24 p-3 text-left transition hover:border-accent/45 hover:bg-control/48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto]"
      type="button"
      onClick={() => onOpen(board.id)}
    >
      <Box className="min-w-0">
        <Text
          className="truncate"
          text={board.title}
          variant="itemTitle"
        />
        <Text
          className="mt-1"
          text={`${board.activeCards} активных задач`}
          variant="caption"
        />
      </Box>
      <Inline className="flex-wrap gap-1.5 sm:justify-end">
        <Box
          tag="span"
          className="rounded-md border border-white/10 bg-black/12 px-2 py-1 text-[11px] font-semibold tabular-nums text-text-muted"
        >
          <Text tag="span" text={`рисков: ${riskCount}`} />
        </Box>
        {board.overloadedLists > 0 ? (
          <Box
            tag="span"
            className="rounded-md border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-100"
          >
            <Text tag="span" text={`WIP ${board.overloadedLists}`} />
          </Box>
        ) : null}
      </Inline>
    </button>
  );
}

export function TaskReviewPage() {
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notesSnapshot, setNotesSnapshot] = useState<Note[]>([]);
  const openCommandPalette = useCallback(() => {
    setNotesSnapshot(loadNotes());
    setIsCommandPaletteOpen(true);
  }, []);
  useCommandPaletteShortcut(openCommandPalette);
  const report = useMemo(
    () => (workspace ? buildTaskReviewReport(workspace) : null),
    [workspace],
  );
  const taskReviewIssuesCount = report ? getTaskReviewIssueCount(report) : 0;
  usePrefetchRoutes([
    activeBoard ? getBoardRoute(activeBoard.id) : null,
    ANALYTICS_ROUTE,
    CALENDAR_ROUTE,
    DRAW_ROUTE,
    MY_WORK_ROUTE,
    NOTES_ROUTE,
    TASK_REVIEW_ROUTE,
  ]);

  if (!isReady || !workspace || !activeBoard || !report) {
    return <TaskReviewLoadingState />;
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
  const openWorkspaceCard = (boardId: string, cardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
    router.push(getBoardRoute(boardId, cardId));
  };
  const openWorkspaceNote = (note: Note) => {
    if (note.boardId) {
      selectProject(note.boardId);
    }

    setIsProjectsOpen(false);
    router.push(`${NOTES_ROUTE}?note=${encodeURIComponent(note.id)}`);
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
  const openReviewItem = (item: TaskReviewItem) => {
    openWorkspaceCard(item.boardId, item.cardId);
  };
  const reviewActions = report.sections.flatMap((section) =>
    section.items.map((item) => ({
      id: `task-review-${section.id}-${item.id}`,
      label: item.cardTitle,
      description: `${section.title} · ${item.boardTitle} / ${item.listTitle}`,
      icon: <ClipboardCheck aria-hidden="true" size={18} />,
      onSelect: () => openReviewItem(item),
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
    ...reviewActions,
    ...getWorkspaceSearchActions({
      activeBoardId: activeBoard.id,
      notes: notesSnapshot,
      workspace,
      onOpenBoard: openBoard,
      onOpenCard: openWorkspaceCard,
      onOpenNote: openWorkspaceNote,
    }),
  ];

  return (
    <Stack
      tag="main"
      className="h-dvh min-h-dvh overflow-hidden bg-canvas text-text"
    >
      <WorkspaceHeader
        activeView="task-review"
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
          onDeleteBoard={deleteProject}
          onOpenChange={setIsProjectsOpen}
          onSelectBoard={selectProjectFromHeader}
        />
      </WorkspaceHeader>

      <Box className="relative flex min-h-0 flex-1 overflow-hidden">
        <Box tag="section" className="relative z-0 min-w-0 flex-1 overflow-y-auto">
          {storageError ? (
            <Box className="border-b border-amber-300/35 bg-amber-950/70 px-4 py-3 text-amber-100 sm:px-6">
              <Flex className="mx-auto max-w-[1800px] items-start gap-2 text-sm leading-5">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={17}
                />
                <Text text={storageError} />
              </Flex>
            </Box>
          ) : null}

          <Grid className="mx-auto max-w-[1800px] gap-4 px-4 py-4 sm:px-6 lg:py-6">
            <Surface className="bg-panel/70 p-4 shadow-panel">
              <Stack className="gap-3 xl:flex-row xl:items-end xl:justify-between">
                <Box className="min-w-0">
                  <Text
                    className="text-accent"
                    text="Обзор задач"
                    variant="eyebrow"
                  />
                  <Title
                    tag="h1"
                    className="mt-2"
                    title="Что требует внимания"
                    variant="page"
                  />
                  <Text
                    className="mt-2 max-w-3xl"
                    text="Страница собирает активные карточки из всех проектов и подсвечивает места, где задачи чаще всего теряются."
                    variant="body"
                  />
                </Box>
                <Inline
                  tag="span"
                  className="min-h-9 w-fit gap-2 rounded-lg border border-white/10 bg-control/45 px-3 text-sm text-text-muted"
                >
                  <Clock3 aria-hidden="true" size={16} />
                  <Text
                    tag="span"
                    text={`Проверено: ${formatDateTime(report.checkedAt)}`}
                  />
                </Inline>
              </Stack>
            </Surface>

            <Grid className="gap-3 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                detail="Не готовые и не архивные карточки."
                icon={<ListChecks aria-hidden="true" size={18} />}
                label="Активные"
                tone="info"
                value={report.activeCards}
              />
              <MetricCard
                detail="Срок уже прошёл, задача не закрыта."
                icon={<CalendarDays aria-hidden="true" size={18} />}
                label="Просрочено"
                tone="danger"
                value={report.overdueCards}
              />
              <MetricCard
                detail="Статус blocked требует решения."
                icon={<ShieldAlert aria-hidden="true" size={18} />}
                label="Блокеры"
                tone="warning"
                value={report.blockedCards}
              />
              <MetricCard
                detail="Нет дедлайна для планирования."
                icon={<Clock3 aria-hidden="true" size={18} />}
                label="Без срока"
                tone="muted"
                value={report.noDueDateCards}
              />
              <MetricCard
                detail="Без изменений больше двух недель."
                icon={<Sparkles aria-hidden="true" size={18} />}
                label="Застой"
                tone="warning"
                value={report.staleCards}
              />
            </Grid>

            <Grid className="gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <Grid className="min-w-0 gap-4 lg:grid-cols-2">
                {report.sections.map((section) => (
                  <ReviewSectionCard
                    key={section.id}
                    section={section}
                    onOpen={openReviewItem}
                  />
                ))}
              </Grid>

              <Surface className="p-4">
                <Box tag="header" className="border-b border-white/10 pb-3">
                  <Title
                    tag="h2"
                    title="Проекты"
                    variant="card"
                  />
                  <Text
                    className="mt-1"
                    text="Быстрый обзор нагрузки и мест, где нарушен WIP."
                    variant="caption"
                  />
                </Box>

                <Grid className="mt-3 gap-2">
                  {report.boards.map((board) => (
                    <BoardSummaryRow
                      key={board.id}
                      board={board}
                      onOpen={openBoard}
                    />
                  ))}
                </Grid>
              </Surface>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {isCommandPaletteOpen ? (
        <CommandPalette
          actions={commandActions}
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      ) : null}
    </Stack>
  );
}
