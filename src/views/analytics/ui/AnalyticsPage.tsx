"use client";

import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CircleCheckBig,
  TimerReset,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  buildBoardAnalytics,
  type AnalyticsSegment,
  type ListAnalyticsSegment,
} from "@/features/view-analytics";
import { useBoardWorkspace } from "@/features/manage-board-workspace";
import {
  ANALYTICS_ROUTE,
  CALENDAR_ROUTE,
  DRAW_ROUTE,
  MY_WORK_ROUTE,
  NOTES_ROUTE,
  getBoardRoute,
} from "@/shared/config/routes";
import { cn, usePrefetchRoutes } from "@/shared/lib";
import { getWorkspaceNavigationActions } from "@/widgets/command-palette/lib/getWorkspaceNavigationActions";
import { useCommandPaletteShortcut } from "@/widgets/command-palette/lib/useCommandPaletteShortcut";
import { ProjectSwitcher } from "@/widgets/project-switcher";
import { WorkspaceHeader } from "@/widgets/workspace-header";

const CommandPalette = dynamic(() =>
  import("@/widgets/command-palette/ui/CommandPalette").then(
    (mod) => mod.CommandPalette,
  ),
);

type ChartMode = "bars" | "line" | "area" | "donut";

function AnalyticsLoadingState() {
  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
      <p
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
      >
        Загружаем аналитику…
      </p>
    </main>
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
    <section
      className={cn(
        "rounded-lg border bg-panel/72 p-4 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]",
        tone === "success" && "border-emerald-300/20",
        tone === "warning" && "border-amber-300/20",
        tone === "danger" && "border-red-300/20",
        tone === "default" && "border-white/10",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-text">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-text-muted">{detail}</p>
    </section>
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
    <div
      className="pointer-events-none absolute z-10 min-w-36 max-w-56 rounded-lg border border-white/12 bg-slate-950/95 px-3 py-2 text-xs shadow-2xl"
      style={{
        left: `${state.x}%`,
        top: `${state.y}%`,
        transform: "translate(-50%, calc(-100% - 0.75rem))",
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: state.segment.color }}
        />
        <p className="min-w-0 truncate font-semibold text-text">
          {state.segment.label}
        </p>
      </div>
      <p className="mt-1 text-text-muted">
        {state.segment.value} задач ·{" "}
        {getSegmentPercent(state.segment.value, total)}%
      </p>
    </div>
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
    <section className="rounded-lg border border-white/10 bg-panel/72 p-4 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]">
      <h2 className="text-sm font-semibold text-text">{title}</h2>

      {mode === "line" || mode === "area" ? (
        <div
          className="relative mt-4 rounded-lg border border-white/8 bg-control/25 p-3"
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="relative h-44">
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
          </div>

          <ChartLegend segments={segments} />
        </div>
      ) : mode === "donut" ? (
        <div
          className="relative mt-4 grid gap-4 rounded-lg border border-white/8 bg-control/25 p-3 md:grid-cols-[13rem_minmax(0,1fr)]"
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="relative mx-auto size-52">
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
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-text">
                  {total}
                </p>
                <p className="text-xs text-text-muted">всего</p>
              </div>
            </div>
            <ChartTooltip state={tooltip} total={total} />
          </div>

          <ChartLegend segments={segments} />
        </div>
      ) : (
        <div
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
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-text-muted">
                    {segment.label}
                  </span>
                  <span className="font-semibold tabular-nums text-text">
                    {segment.value}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-control">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
          <ChartTooltip state={tooltip} total={total} />
        </div>
      )}
    </section>
  );
}

function ChartLegend({
  segments,
}: Readonly<{ segments: readonly AnalyticsSegment[] }>) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {segments.map((segment) => (
        <div key={segment.id} className="flex items-center gap-2 text-xs">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: segment.color }}
          />
          <span className="min-w-0 flex-1 truncate text-text-muted">
            {segment.label}
          </span>
          <span className="font-semibold tabular-nums text-text">
            {segment.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ListProgress({
  segments,
}: Readonly<{ segments: readonly ListAnalyticsSegment[] }>) {
  return (
    <section className="rounded-lg border border-white/10 bg-panel/72 p-4 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]">
      <h2 className="text-sm font-semibold text-text">Списки</h2>
      <div className="mt-4 space-y-3">
        {segments.map((segment) => {
          const percent = segment.total
            ? Math.round((segment.completed / segment.total) * 100)
            : 0;

          return (
            <div
              key={segment.id}
              className="rounded-lg border border-white/8 bg-control/30 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium text-text">
                  {segment.label}
                </p>
                <p className="shrink-0 text-xs font-semibold tabular-nums text-text-muted">
                  {segment.completed}/{segment.total}
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);
  useCommandPaletteShortcut(openCommandPalette);
  const analytics = useMemo(
    () => (activeBoard ? buildBoardAnalytics(activeBoard) : null),
    [activeBoard],
  );
  usePrefetchRoutes([
    activeBoard ? getBoardRoute(activeBoard.id) : null,
    NOTES_ROUTE,
    CALENDAR_ROUTE,
    DRAW_ROUTE,
    MY_WORK_ROUTE,
    ANALYTICS_ROUTE,
  ]);

  if (!isReady || !workspace || !activeBoard || !analytics) {
    return <AnalyticsLoadingState />;
  }

  const statusLabel =
    persistenceState === "saving"
      ? "Сохраняем…"
      : persistenceState === "error"
        ? "Ошибка сохранения"
        : workspaceStorage.kind === "folder" && workspaceStorage.isConnected
          ? `Сохранено в папку: ${workspaceStorage.name}`
          : workspaceStorage.kind === "folder"
            ? "Требуется доступ к папке"
            : "Сохранено в браузере";

  const openBoard = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
    router.push(getBoardRoute(boardId));
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
    }),
    ...chartModeActions,
  ];

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="analytics"
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        persistenceLabel={statusLabel}
        onOpenAnalytics={() => router.push(ANALYTICS_ROUTE)}
        onOpenBoard={() => openBoard(activeBoard.id)}
        onOpenCalendar={() => router.push(CALENDAR_ROUTE)}
        onOpenCommands={openCommandPalette}
        onOpenDraw={() => router.push(DRAW_ROUTE)}
        onOpenMyWork={() => router.push(MY_WORK_ROUTE)}
        onOpenNotes={() => router.push(NOTES_ROUTE)}
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

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <section className="relative z-0 min-w-0 flex-1 overflow-y-auto">
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

          <div className="mx-auto grid max-w-[1800px] gap-4 px-4 py-4 sm:px-6 lg:py-6">
            <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-panel/60 p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  {activeBoard.title}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-text">
                  Состояние задач
                </h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-control/50 px-3 py-2 text-sm text-text-muted">
                  <BarChart3 aria-hidden="true" size={17} />
                  {analytics.activeCards} активных карточек
                </div>
                <div className="inline-grid grid-cols-2 rounded-lg border border-white/10 bg-control/35 p-1 sm:grid-cols-4">
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
                    Бары
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
                    Линия
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
                    Площадь
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
                    Donut
                  </button>
                </div>
              </div>
            </section>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <ListProgress segments={analytics.listSegments} />

              <section className="rounded-lg border border-white/10 bg-panel/72 p-4 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]">
                <h2 className="text-sm font-semibold text-text">Сроки</h2>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-control/30 p-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-red-500/12 text-red-200">
                      <TimerReset aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">
                        {analytics.overdueCards} просрочено
                      </p>
                      <p className="text-xs text-text-muted">
                        Не готово и срок уже прошёл
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-control/30 p-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-sky-500/12 text-sky-200">
                      <CalendarClock aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">
                        {analytics.dueSoonCards} на ближайшие 7 дней
                      </p>
                      <p className="text-xs text-text-muted">
                        Можно планировать загрузку
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-control/30 p-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-emerald-500/12 text-emerald-200">
                      <CircleCheckBig aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">
                        {analytics.completedCards} завершено
                      </p>
                      <p className="text-xs text-text-muted">
                        По статусу карточки
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
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
