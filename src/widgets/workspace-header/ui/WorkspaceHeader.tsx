"use client";

import {
  CalendarDays,
  Cloud,
  LayoutDashboard,
  Menu,
  Palette,
} from "lucide-react";
import type { ReactNode } from "react";

import { APP_NAME } from "@/shared/config/app";
import { cn } from "@/shared/lib";
import { IconButton } from "@/shared/ui";

export type WorkspaceView = "board" | "calendar";

type WorkspaceHeaderProps = Readonly<{
  activeView: WorkspaceView;
  children: ReactNode;
  isAppearanceOpen?: boolean;
  isPersistenceError: boolean;
  isProjectsOpen: boolean;
  persistenceLabel: string;
  onOpenBoard: () => void;
  onOpenCalendar: () => void;
  onToggleAppearance?: () => void;
  onToggleProjects: () => void;
}>;

export function WorkspaceHeader({
  activeView,
  children,
  isAppearanceOpen = false,
  isPersistenceError,
  isProjectsOpen,
  persistenceLabel,
  onOpenBoard,
  onOpenCalendar,
  onToggleAppearance,
  onToggleProjects,
}: WorkspaceHeaderProps) {
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
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {APP_NAME}
            </p>
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
