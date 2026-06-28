"use client";

import {
  Archive,
  CalendarDays,
  Cloud,
  Command,
  Download,
  LayoutDashboard,
  ListFilter,
  Menu,
  Palette,
  Redo2,
  Undo2,
} from "lucide-react";
import type { ReactNode } from "react";

import { APP_NAME } from "@/shared/config/app";
import { cn } from "@/shared/lib";
import { IconButton } from "@/shared/ui";

export type WorkspaceView = "board" | "calendar";

type WorkspaceHeaderProps = Readonly<{
  activeView: WorkspaceView;
  children: ReactNode;
  activeFiltersCount?: number;
  canRedo?: boolean;
  canUndo?: boolean;
  isAppearanceOpen?: boolean;
  isArchiveOpen?: boolean;
  isFiltersOpen?: boolean;
  isPersistenceError: boolean;
  isProjectsOpen: boolean;
  persistenceLabel: string;
  onOpenBoard: () => void;
  onOpenCalendar: () => void;
  onOpenCommands?: () => void;
  onOpenWorkspaceData?: () => void;
  onRedo?: () => void;
  onToggleAppearance?: () => void;
  onToggleArchive?: () => void;
  onToggleFilters?: () => void;
  onToggleProjects: () => void;
  onUndo?: () => void;
}>;

export function WorkspaceHeader({
  activeView,
  children,
  activeFiltersCount = 0,
  canRedo = false,
  canUndo = false,
  isAppearanceOpen = false,
  isArchiveOpen = false,
  isFiltersOpen = false,
  isPersistenceError,
  isProjectsOpen,
  persistenceLabel,
  onOpenBoard,
  onOpenCalendar,
  onOpenCommands,
  onOpenWorkspaceData,
  onRedo,
  onToggleAppearance,
  onToggleArchive,
  onToggleFilters,
  onToggleProjects,
  onUndo,
}: WorkspaceHeaderProps) {
  const filtersLabel = activeFiltersCount
    ? `Открыть фильтры: активно ${activeFiltersCount}`
    : "Открыть фильтры";

  return (
    <header className="z-50 border-b border-white/10 bg-panel/95 px-3 py-3 backdrop-blur-xl sm:px-5">
      <div className="mx-auto flex max-w-[1800px] items-center gap-2 sm:gap-4">
        <IconButton
          aria-pressed={isProjectsOpen}
          className="text-text-muted hover:bg-control hover:text-text"
          label={isProjectsOpen ? "Закрыть проекты" : "Открыть проекты"}
          size="lg"
          onClick={onToggleProjects}
        >
          <Menu aria-hidden="true" size={20} />
        </IconButton>

        <div className="hidden items-center gap-3 sm:flex">
          <button
            aria-label="Открыть доску"
            className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm shadow-accent/20 transition hover:bg-accent-hover"
            type="button"
            onClick={onOpenBoard}
          >
            <LayoutDashboard aria-hidden="true" size={20} />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{APP_NAME}</p>
            <p className="text-xs text-text-muted">Локальные проекты</p>
          </div>
        </div>

        <div className="min-w-0 flex-1 sm:max-w-xl">{children}</div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span
            className={cn(
              "hidden items-center gap-1.5 text-xs font-medium md:inline-flex",
              isPersistenceError ? "text-red-300" : "text-text-muted",
            )}
          >
            <Cloud aria-hidden="true" size={15} />
            {persistenceLabel}
          </span>

          {onUndo ? (
            <IconButton
              className="hidden text-text-muted hover:bg-control hover:text-text sm:grid"
              disabled={!canUndo}
              label="Отменить действие"
              onClick={onUndo}
            >
              <Undo2 aria-hidden="true" size={18} />
            </IconButton>
          ) : null}
          {onRedo ? (
            <IconButton
              className="hidden text-text-muted hover:bg-control hover:text-text sm:grid"
              disabled={!canRedo}
              label="Повторить действие"
              onClick={onRedo}
            >
              <Redo2 aria-hidden="true" size={18} />
            </IconButton>
          ) : null}

          {onOpenCommands ? (
            <IconButton
              className="text-text-muted hover:bg-control hover:text-text"
              label="Открыть команды"
              size="lg"
              onClick={onOpenCommands}
            >
              <Command aria-hidden="true" size={18} />
            </IconButton>
          ) : null}

          <IconButton
            aria-current={activeView === "calendar" ? "page" : undefined}
            className={cn(
              activeView === "calendar"
                ? "bg-accent text-accent-foreground"
                : "text-text-muted hover:bg-control hover:text-text",
            )}
            label="Открыть календарь"
            size="lg"
            onClick={onOpenCalendar}
          >
            <CalendarDays aria-hidden="true" size={19} />
          </IconButton>

          {onToggleFilters ? (
            <IconButton
              aria-pressed={isFiltersOpen}
              className={cn(
                isFiltersOpen
                  ? "bg-accent text-accent-foreground"
                  : "text-text-muted hover:bg-control hover:text-text",
              )}
              label={filtersLabel}
              size="lg"
              onClick={onToggleFilters}
            >
              <span className="relative grid place-items-center">
                <ListFilter aria-hidden="true" size={19} />
                {activeFiltersCount > 0 ? (
                  <span className="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-slate-950">
                    {activeFiltersCount}
                  </span>
                ) : null}
              </span>
            </IconButton>
          ) : null}

          {onToggleArchive ? (
            <IconButton
              aria-pressed={isArchiveOpen}
              className={cn(
                isArchiveOpen
                  ? "bg-accent text-accent-foreground"
                  : "text-text-muted hover:bg-control hover:text-text",
              )}
              label="Открыть архив"
              size="lg"
              onClick={onToggleArchive}
            >
              <Archive aria-hidden="true" size={18} />
            </IconButton>
          ) : null}

          {onOpenWorkspaceData ? (
            <IconButton
              className="text-text-muted hover:bg-control hover:text-text"
              label="Экспорт и импорт"
              size="lg"
              onClick={onOpenWorkspaceData}
            >
              <Download aria-hidden="true" size={18} />
            </IconButton>
          ) : null}

          {onToggleAppearance ? (
            <IconButton
              aria-pressed={isAppearanceOpen}
              className={cn(
                isAppearanceOpen
                  ? "bg-accent text-accent-foreground"
                  : "text-text-muted hover:bg-control hover:text-text",
              )}
              label="Оформление доски"
              size="lg"
              onClick={onToggleAppearance}
            >
              <Palette aria-hidden="true" size={19} />
            </IconButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}
