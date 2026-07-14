"use client";

import { AlertTriangle, BarChart3, CalendarClock, CircleCheckBig, TimerReset } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { buildBoardAnalytics, type AnalyticsSegment, type ListAnalyticsSegment } from "@/features/view-analytics";
import { useBoardWorkspace } from "@/features/manage-board-workspace";
import { ANALYTICS_ROUTE, CALENDAR_ROUTE, NOTES_ROUTE, getBoardRoute } from "@/shared/config/routes";
import { cn } from "@/shared/lib";
import { ProjectSidebar } from "@/widgets/project-sidebar";
import { WorkspaceHeader } from "@/widgets/workspace-header";

type ChartMode = "bars" | "line";

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

function SegmentChart({
  mode,
  title,
  segments,
}: Readonly<{
  mode: ChartMode;
  title: string;
  segments: readonly AnalyticsSegment[];
}>) {
  const max = Math.max(1, ...segments.map((segment) => segment.value));
  const chartPoints = segments.map((segment, index) => {
    const x = segments.length <= 1 ? 50 : (index / (segments.length - 1)) * 100;
    const y = 92 - (segment.value / max) * 76;

    return { ...segment, x, y };
  });
  const polylinePoints = chartPoints
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  return (
    <section className="rounded-lg border border-white/10 bg-panel/72 p-4 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]">
      <h2 className="text-sm font-semibold text-text">{title}</h2>

      {mode === "line" ? (
        <div className="mt-4 rounded-lg border border-white/8 bg-control/25 p-3">
          <svg
            aria-label={`${title}: линейный график`}
            className="h-44 w-full overflow-visible"
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
            <polyline
              fill="none"
              points={polylinePoints}
              stroke="rgb(56, 189, 248)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            {chartPoints.map((point) => (
              <circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                fill={point.color}
                r="2.8"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {segments.map((segment) => (
              <div key={segment.id} className="flex items-center gap-2 text-xs">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
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
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {segments.map((segment) => (
            <div key={segment.id}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-text-muted">{segment.label}</span>
                <span className="font-semibold tabular-nums text-text">{segment.value}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-control">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, (segment.value / max) * 100)}%`,
                    backgroundColor: segment.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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
            <div key={segment.id} className="rounded-lg border border-white/8 bg-control/30 p-3">
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
  const analytics = useMemo(
    () => (activeBoard ? buildBoardAnalytics(activeBoard) : null),
    [activeBoard],
  );

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
            ? "Папка требует доступа"
            : "Сохранено в браузере";

  const openBoard = (boardId: string) => {
    selectProject(boardId);
    setIsProjectsOpen(false);
    router.push(getBoardRoute(boardId));
  };

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
        onOpenNotes={() => router.push(NOTES_ROUTE)}
        onToggleProjects={() => setIsProjectsOpen((current) => !current)}
      >
        <div className="flex flex-col items-center px-2 py-2 sm:px-3">
          <h1 className="text-base font-semibold text-text sm:text-lg">
            Аналитика
          </h1>
          <p className="hidden text-xs text-text-muted sm:block">
            Прогресс и риски активной доски
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
              openBoard(createdBoardId);
            }
          }}
          onDeleteBoard={deleteProject}
          onSelectBoard={openBoard}
        />

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
                <div className="inline-grid grid-cols-2 rounded-lg border border-white/10 bg-control/35 p-1">
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
                      <p className="text-xs text-text-muted">Не готово и срок уже прошёл</p>
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
                      <p className="text-xs text-text-muted">Можно планировать загрузку</p>
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
                      <p className="text-xs text-text-muted">По статусу карточки</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
