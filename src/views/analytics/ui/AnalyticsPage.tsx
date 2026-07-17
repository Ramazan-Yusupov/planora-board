"use client";

import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CircleCheckBig,
  TimerReset,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  buildBoardAnalytics,
  type AnalyticsSegment,
  type ListAnalyticsSegment,
} from "@/features/view-analytics";
import { buildTaskReviewReport, getTaskReviewIssueCount } from "@/features/task-review";
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
import { Box, Flex, Grid, Inline, Stack, Surface, Text, Title } from "@/shared/ui";
import {
  CommandPalette,
  getWorkspaceSearchActions,
} from "@/widgets/command-palette";
import { getWorkspaceNavigationActions } from "@/widgets/command-palette/lib/getWorkspaceNavigationActions";
import { useCommandPaletteShortcut } from "@/widgets/command-palette/lib/useCommandPaletteShortcut";
import { ProjectSwitcher } from "@/widgets/project-switcher";
import { WorkspaceHeader } from "@/widgets/workspace-header";

type ChartMode = "bars" | "line" | "area" | "donut";

function AnalyticsLoadingState() {
  return (
    <Grid
      tag="main"
      className="h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text"
    >
      <Text
        aria-busy="true"
        aria-live="polite"
        text="Загружаем аналитику…"
        variant="loading"
      />
    </Grid>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: Readonly<{
  label: string;
  value: string | number;
  detail: string;
  tone?: "default" | "success" | "warning" | "danger";
}>) {
  return (
    <Surface
      className={cn(
        "p-4",
        tone === "success" && "border-emerald-300/20",
        tone === "warning" && "border-amber-300/20",
        tone === "danger" && "border-red-300/20",
        tone === "default" && "border-white/10",
      )}
    >
      <Text text={label} variant="eyebrow" />
      <Text className="mt-3" text={value} variant="stat" />
      <Text className="mt-2" text={detail} variant="muted" />
    </Surface>
  );
}

type ChartPoint = AnalyticsSegment & Readonly<{ x: number; y: number }>;
type ChartTooltipState = Readonly<{
  segment: AnalyticsSegment;
  x: number;
  y: number;
}>;

function getSegmentPercent(value: number, total: number): number {
  return total ? Math.round((value / total) * 100) : 0;
}

function getPolarPoint(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function getDonutArcPath(
  startAngle: number,
  endAngle: number,
  outerRadius = 42,
  innerRadius = 26,
) {
  const startOuter = getPolarPoint(50, 50, outerRadius, endAngle);
  const endOuter = getPolarPoint(50, 50, outerRadius, startAngle);
  const startInner = getPolarPoint(50, 50, innerRadius, startAngle);
  const endInner = getPolarPoint(50, 50, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function ChartTooltip({
  state,
  total,
}: Readonly<{
  state: ChartTooltipState | null;
  total: number;
}>) {
  if (!state) {
    return null;
  }

  return (
    <Box
      className="pointer-events-none absolute z-10 min-w-36 max-w-56 rounded-lg border border-white/12 bg-slate-950/95 px-3 py-2 text-xs shadow-2xl"
      style={{
        left: `${state.x}%`,
        top: `${state.y}%`,
        transform: "translate(-50%, calc(-100% - 0.75rem))",
      }}
    >
      <Inline className="min-w-0 gap-2">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: state.segment.color }}
        />
        <Text
          className="min-w-0 truncate font-semibold text-text"
          text={state.segment.label}
        />
      </Inline>
      <Text
        className="mt-1 text-text-muted"
        text={`${state.segment.value} задач · ${getSegmentPercent(
          state.segment.value,
          total,
        )}%`}
      />
    </Box>
  );
}

function SegmentChart({
  mode,
  title,
  segments,
}: Readonly<{
  mode: ChartMode;
  title: string;
  segments: readonly AnalyticsSegment[];
}>) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const max = Math.max(1, ...segments.map((segment) => segment.value));
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const chartPoints: ChartPoint[] = segments.map((segment, index) => {
    const x = segments.length <= 1 ? 50 : (index / (segments.length - 1)) * 100;
    const y = 92 - (segment.value / max) * 76;

    return { ...segment, x, y };
  });
  const polylinePoints = chartPoints
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const areaPoints = `0,96 ${polylinePoints} 100,96`;
  const donutSlices = segments.reduce<{
    angle: number;
    slices: Array<
      Readonly<{
        endAngle: number;
        segment: AnalyticsSegment;
        startAngle: number;
        tooltipPoint: { x: number; y: number };
      }>
    >;
  }>(
    (accumulator, segment) => {
      if (!total || segment.value === 0) {
        return accumulator;
      }

      const startAngle = accumulator.angle;
      const sliceAngle = (segment.value / total) * 360;
      const rawEndAngle = startAngle + sliceAngle;
      const endAngle = sliceAngle >= 360 ? startAngle + 359.99 : rawEndAngle;
      const midpoint = startAngle + sliceAngle / 2;

      return {
        angle: rawEndAngle,
        slices: [
          ...accumulator.slices,
          {
            endAngle,
            segment,
            startAngle,
            tooltipPoint: getPolarPoint(50, 50, 38, midpoint),
          },
        ],
      };
    },
    { angle: 0, slices: [] },
  ).slices;

  return (
    <Surface className="p-4">
      <Title tag="h2" title={title} variant="card" />

      {mode === "line" || mode === "area" ? (
        <Box
          className="relative mt-4 rounded-lg border border-white/8 bg-control/25 p-3"
          onMouseLeave={() => setTooltip(null)}
        >
          <Box className="relative h-44">
            <svg
              aria-label={`${title}: ${mode === "line" ? "линейный график" : "график площади"}`}
              className="absolute inset-0 size-full"
              preserveAspectRatio="none"
              role="img"
              viewBox="0 0 100 100"
            >
              {[16, 35, 54, 73, 92].map((y) => (
                <line
                  key={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.6"
                  vectorEffect="non-scaling-stroke"
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                />
              ))}
              {mode === "area" ? (
                <polygon
                  fill="rgba(56, 189, 248, 0.14)"
                  points={areaPoints}
                  stroke="none"
                />
              ) : null}
              <polyline
                fill="none"
                points={polylinePoints}
                stroke="rgb(56, 189, 248)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {chartPoints.map((point) => (
              <button
                key={point.id}
                aria-label={`${point.label}: ${point.value}`}
                className="absolute z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel shadow-[0_0_0_3px_rgb(255_255_255/_6%)] transition hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  backgroundColor: point.color,
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                }}
                type="button"
                onFocus={() =>
                  setTooltip({ segment: point, x: point.x, y: point.y })
                }
                onMouseEnter={() =>
                  setTooltip({ segment: point, x: point.x, y: point.y })
                }
              />
            ))}

            <ChartTooltip state={tooltip} total={total} />
          </Box>

          <ChartLegend segments={segments} />
        </Box>
      ) : mode === "donut" ? (
        <Grid
          className="relative mt-4 gap-4 rounded-lg border border-white/8 bg-control/25 p-3 md:grid-cols-[13rem_minmax(0,1fr)]"
          onMouseLeave={() => setTooltip(null)}
        >
          <Box className="relative mx-auto size-52">
            <svg
              aria-label={`${title}: Donutовый график`}
              className="size-full"
              role="img"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="34"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="16"
              />
              {donutSlices.map(
                ({ endAngle, segment, startAngle, tooltipPoint }) => {
                  return (
                    <path
                      key={segment.id}
                      aria-label={`${segment.label}: ${segment.value}`}
                      className="cursor-pointer opacity-90 outline-none transition hover:opacity-100 focus-visible:opacity-100"
                      d={getDonutArcPath(startAngle, endAngle)}
                      fill={segment.color}
                      role="button"
                      tabIndex={0}
                      onFocus={() =>
                        setTooltip({
                          segment,
                          x: tooltipPoint.x,
                          y: tooltipPoint.y,
                        })
                      }
                      onMouseEnter={() =>
                        setTooltip({
                          segment,
                          x: tooltipPoint.x,
                          y: tooltipPoint.y,
                        })
                      }
                    />
                  );
                },
              )}
            </svg>
            <Grid className="pointer-events-none absolute inset-0 place-items-center text-center">
              <Box>
                <Text
                  className="text-2xl font-semibold tabular-nums text-text"
                  text={total}
                />
                <Text text="всего" variant="caption" />
              </Box>
            </Grid>
            <ChartTooltip state={tooltip} total={total} />
          </Box>

          <ChartLegend segments={segments} />
        </Grid>
      ) : (
        <Box
          className="relative mt-4 space-y-3"
          onMouseLeave={() => setTooltip(null)}
        >
          {segments.map((segment, index) => {
            const width = total
              ? Math.max(segment.value > 0 ? 4 : 0, (segment.value / max) * 100)
              : 0;

            return (
              <button
                key={segment.id}
                className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                onFocus={() =>
                  setTooltip({
                    segment,
                    x: 72,
                    y: ((index + 0.5) / Math.max(1, segments.length)) * 100,
                  })
                }
                onMouseEnter={() =>
                  setTooltip({
                    segment,
                    x: 72,
                    y: ((index + 0.5) / Math.max(1, segments.length)) * 100,
                  })
                }
              >
                <Inline className="justify-between gap-3 text-xs">
                  <Text
                    tag="span"
                    className="min-w-0 truncate text-text-muted"
                    text={segment.label}
                  />
                  <Text
                    tag="span"
                    className="font-semibold tabular-nums text-text"
                    text={segment.value}
                  />
                </Inline>
                <Box className="mt-1.5 h-2 overflow-hidden rounded-full bg-control">
                  <Box
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                </Box>
              </button>
            );
          })}
          <ChartTooltip state={tooltip} total={total} />
        </Box>
      )}
    </Surface>
  );
}

function ChartLegend({
  segments,
}: Readonly<{ segments: readonly AnalyticsSegment[] }>) {
  return (
    <Grid className="mt-3 gap-2 sm:grid-cols-2">
      {segments.map((segment) => (
        <Inline key={segment.id} className="gap-2 text-xs">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: segment.color }}
          />
          <Text
            tag="span"
            className="min-w-0 flex-1 truncate text-text-muted"
            text={segment.label}
          />
          <Text
            tag="span"
            className="font-semibold tabular-nums text-text"
            text={segment.value}
          />
        </Inline>
      ))}
    </Grid>
  );
}

function ListProgress({
  segments,
}: Readonly<{ segments: readonly ListAnalyticsSegment[] }>) {
  return (
    <Surface className="p-4">
      <Title tag="h2" title="Списки" variant="card" />
      <Stack className="mt-4 gap-3">
        {segments.map((segment) => {
          const percent = segment.total
            ? Math.round((segment.completed / segment.total) * 100)
            : 0;

          return (
            <Box
              key={segment.id}
              className="rounded-lg border border-white/8 bg-control/30 p-3"
            >
              <Inline className="justify-between gap-3">
                <Text
                  className="min-w-0 truncate text-sm font-medium text-text"
                  text={segment.label}
                />
                <Text
                  className="shrink-0 text-xs font-semibold tabular-nums text-text-muted"
                  text={`${segment.completed}/${segment.total}`}
                />
              </Inline>
              <Box className="mt-2 h-2 overflow-hidden rounded-full bg-black/20">
                <Box
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${percent}%` }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Surface>
  );
}

export function AnalyticsPage() {
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
  const [chartMode, setChartMode] = useState<ChartMode>("bars");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notesSnapshot, setNotesSnapshot] = useState<Note[]>([]);
  const openCommandPalette = useCallback(() => {
    setNotesSnapshot(loadNotes());
    setIsCommandPaletteOpen(true);
  }, []);
  useCommandPaletteShortcut(openCommandPalette);
  const analytics = useMemo(
    () => (activeBoard ? buildBoardAnalytics(activeBoard) : null),
    [activeBoard],
  );
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

  if (!isReady || !workspace || !activeBoard || !analytics) {
    return <AnalyticsLoadingState />;
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
  const createProjectFromHeader = (title: string, templateId?: Parameters<typeof createProject>[1]) => {
    const createdBoardId = createProject(title, templateId);

    if (createdBoardId) {
      selectProjectFromHeader(createdBoardId);
    }
  };
  const chartModeActions = [
    ["bars", "Бары"],
    ["line", "Линия"],
    ["area", "Площадь"],
    ["donut", "Donut"],
  ].map(([mode, label]) => ({
    id: `analytics-chart-${mode}`,
    label: `График: ${label}`,
    description: "Переключить режим визуализации аналитики",
    disabled: chartMode === mode,
    icon: <BarChart3 aria-hidden="true" size={18} />,
    onSelect: () => setChartMode(mode as ChartMode),
  }));
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
    ...chartModeActions,
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
        activeView="analytics"
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
            <Surface className="flex flex-col gap-3 bg-panel/60 p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between">
              <Box>
                <Text
                  className="text-accent"
                  text={activeBoard.title}
                  variant="eyebrow"
                />
                <Title
                  className="mt-1"
                  tag="h2"
                  title="Состояние задач"
                  variant="section"
                />
              </Box>
              <Stack className="gap-2 sm:flex-row sm:items-center">
                <Inline className="gap-2 rounded-lg border border-white/10 bg-control/50 px-3 py-2 text-sm text-text-muted">
                  <BarChart3 aria-hidden="true" size={17} />
                  <Text
                    tag="span"
                    text={`${analytics.activeCards} активных карточек`}
                  />
                </Inline>
                <Grid className="grid-cols-2 rounded-lg border border-white/10 bg-control/35 p-1 sm:grid-cols-4">
                  <button
                    aria-pressed={chartMode === "bars"}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition",
                      chartMode === "bars"
                        ? "bg-accent text-accent-foreground"
                        : "text-text-muted hover:bg-control hover:text-text",
                    )}
                    type="button"
                    onClick={() => setChartMode("bars")}
                  >
                    <Text tag="span" text="Бары" />
                  </button>
                  <button
                    aria-pressed={chartMode === "line"}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition",
                      chartMode === "line"
                        ? "bg-accent text-accent-foreground"
                        : "text-text-muted hover:bg-control hover:text-text",
                    )}
                    type="button"
                    onClick={() => setChartMode("line")}
                  >
                    <Text tag="span" text="Линия" />
                  </button>
                  <button
                    aria-pressed={chartMode === "area"}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition",
                      chartMode === "area"
                        ? "bg-accent text-accent-foreground"
                        : "text-text-muted hover:bg-control hover:text-text",
                    )}
                    type="button"
                    onClick={() => setChartMode("area")}
                  >
                    <Text tag="span" text="Площадь" />
                  </button>
                  <button
                    aria-pressed={chartMode === "donut"}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition",
                      chartMode === "donut"
                        ? "bg-accent text-accent-foreground"
                        : "text-text-muted hover:bg-control hover:text-text",
                    )}
                    type="button"
                    onClick={() => setChartMode("donut")}
                  >
                    <Text tag="span" text="Donut" />
                  </button>
                </Grid>
              </Stack>
            </Surface>

            <Grid className="gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                detail="От активных задач на доске"
                label="Выполнено"
                tone="success"
                value={`${analytics.completionPercent}%`}
              />
              <MetricCard
                detail={`${analytics.completedCards} из ${analytics.activeCards} активных`}
                label="Готовые"
                tone="success"
                value={analytics.completedCards}
              />
              <MetricCard
                detail="Требуют внимания"
                label="Заблокировано"
                tone="warning"
                value={analytics.blockedCards}
              />
              <MetricCard
                detail="Невыполненные задачи со сроком в прошлом"
                label="Просрочено"
                tone="danger"
                value={analytics.overdueCards}
              />
            </Grid>

            <Grid className="gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <SegmentChart
                mode={chartMode}
                segments={analytics.statusSegments}
                title="По статусам"
              />
              <SegmentChart
                mode={chartMode}
                segments={analytics.prioritySegments}
                title="По приоритетам"
              />
            </Grid>

            <Grid className="gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <ListProgress segments={analytics.listSegments} />

              <Surface className="p-4">
                <Title tag="h2" title="Сроки" variant="card" />
                <div className="mt-4 grid gap-3">
                  <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-control/30 p-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-red-500/12 text-red-200">
                      <TimerReset aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0">
                      <Text
                        text={`${analytics.overdueCards} просрочено`}
                        variant="itemTitle"
                      />
                      <Text
                        text="Не готово и срок уже прошёл"
                        variant="caption"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-control/30 p-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-sky-500/12 text-sky-200">
                      <CalendarClock aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0">
                      <Text
                        text={`${analytics.dueSoonCards} на ближайшие 7 дней`}
                        variant="itemTitle"
                      />
                      <Text
                        text="Можно планировать загрузку"
                        variant="caption"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-control/30 p-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-emerald-500/12 text-emerald-200">
                      <CircleCheckBig aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0">
                      <Text
                        text={`${analytics.completedCards} завершено`}
                        variant="itemTitle"
                      />
                      <Text text="По статусу карточки" variant="caption" />
                    </div>
                  </div>
                </div>
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
