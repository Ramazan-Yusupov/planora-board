"use client";

import {
  Archive,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Cloud,
  Command,
  Download,
  FileText,
  LayoutDashboard,
  ListFilter,
  Menu,
  MoreHorizontal,
  Palette,
  Redo2,
  Settings2,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { APP_NAME } from "@/shared/config/app";
import { cn } from "@/shared/lib";
import { IconButton, Tooltip } from "@/shared/ui";

export type WorkspaceView =
  | "board"
  | "calendar"
  | "analytics"
  | "my-work"
  | "notes";

type WorkspaceHeaderProps = Readonly<{
  activeView: WorkspaceView;
  children: ReactNode;
  activeFiltersCount?: number;
  canRedo?: boolean;
  canUndo?: boolean;
  dataToolsGroupLabel?: string;
  isAppearanceOpen?: boolean;
  isArchiveOpen?: boolean;
  isFiltersOpen?: boolean;
  isBoardToolsOpen?: boolean;
  isPersistenceError: boolean;
  isProjectsOpen: boolean;
  persistenceLabel: string;
  onOpenBoard: () => void;
  onOpenAnalytics?: () => void;
  onOpenCalendar: () => void;
  onOpenMyWork?: () => void;
  onOpenNotes?: () => void;
  onOpenCommands?: () => void;
  onOpenWorkspaceData?: () => void;
  workspaceDataLabel?: string;
  onRedo?: () => void;
  onToggleAppearance?: () => void;
  onToggleArchive?: () => void;
  onToggleBoardTools?: () => void;
  onToggleFilters?: () => void;
  onToggleProjects: () => void;
  onUndo?: () => void;
}>;

type HeaderMenuItemProps = Readonly<{
  icon: ReactNode;
  label: string;
  onSelect: () => void;
  active?: boolean;
  badge?: number;
  disabled?: boolean;
  shortcut?: string;
}>;

function HeaderMenuItem({
  icon,
  label,
  onSelect,
  active = false,
  badge,
  disabled = false,
  shortcut,
}: HeaderMenuItemProps) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
        active
          ? "bg-accent text-accent-foreground"
          : "text-text-muted hover:bg-control hover:text-text",
        disabled && "cursor-not-allowed opacity-45",
      )}
      disabled={disabled}
      role="menuitem"
      type="button"
      onClick={onSelect}
    >
      <span className="grid size-7 shrink-0 place-items-center">{icon}</span>

      <span className="min-w-0 flex-1 truncate">{label}</span>

      {shortcut ? (
        <kbd
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
            active
              ? "border-accent-foreground/30 text-accent-foreground/80"
              : "border-white/10 text-text-muted",
          )}
        >
          {shortcut}
        </kbd>
      ) : null}

      {badge ? (
        <span
          className={cn(
            "grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold",
            active
              ? "bg-accent-foreground text-accent"
              : "bg-danger text-slate-950",
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function WorkspaceHeader({
  activeView,
  children,
  activeFiltersCount = 0,
  canRedo = false,
  canUndo = false,
  dataToolsGroupLabel,
  isAppearanceOpen = false,
  isArchiveOpen = false,
  isFiltersOpen = false,
  isBoardToolsOpen = false,
  isPersistenceError,
  isProjectsOpen,
  persistenceLabel,
  onOpenBoard,
  onOpenAnalytics,
  onOpenCalendar,
  onOpenMyWork,
  onOpenNotes,
  onOpenCommands,
  onOpenWorkspaceData,
  workspaceDataLabel = "Экспорт и импорт",
  onRedo,
  onToggleAppearance,
  onToggleArchive,
  onToggleBoardTools,
  onToggleFilters,
  onToggleProjects,
  onUndo,
}: WorkspaceHeaderProps) {
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  const filtersLabel = activeFiltersCount
    ? `Фильтры: активно ${activeFiltersCount}`
    : "Фильтры";
  const dataGroupLabel =
    dataToolsGroupLabel ?? (activeView === "board" ? "Доска" : "Данные");

  const desktopIconClass =
    "rounded-xl text-text-muted hover:bg-control/85 hover:text-text hover:shadow-[inset_0_1px_0_rgb(255_255_255_/_4%)]";
  const desktopIconGroupClass =
    "flex items-center gap-1 border-r border-white/10 pr-2";

  useEffect(() => {
    if (!isActionsMenuOpen) {
      return;
    }

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(event.target as Node)
      ) {
        setIsActionsMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isActionsMenuOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const closeMenuOnDesktop = () => {
      if (mediaQuery.matches) {
        setIsActionsMenuOpen(false);
      }
    };

    closeMenuOnDesktop();
    mediaQuery.addEventListener("change", closeMenuOnDesktop);

    return () => {
      mediaQuery.removeEventListener("change", closeMenuOnDesktop);
    };
  }, []);

  const selectMenuAction = (action: (() => void) | undefined) => {
    action?.();
    setIsActionsMenuOpen(false);
  };

  return (
    <header className="z-50 border-b border-white/10 bg-panel/88 px-2 py-2 shadow-[0_1px_0_rgb(255_255_255/2%),0_16px_40px_rgb(0_0_0/15%)] backdrop-blur-2xl sm:px-5 sm:py-3">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-2 sm:gap-3">
        <div className="flex">
          <IconButton
            aria-pressed={isProjectsOpen}
            className="size-11 text-text-muted hover:bg-control hover:text-text sm:size-10"
            label={isProjectsOpen ? "Закрыть проекты" : "Открыть проекты"}
            size="lg"
            onClick={onToggleProjects}
          >
            <Menu aria-hidden="true" size={20} />
          </IconButton>

          <div className="hidden items-center gap-3 sm:flex">
            <Tooltip label="Рабочая доска">
              <button
                aria-label="Открыть доску"
                className="grid size-10 place-items-center rounded-xl border border-accent/25 bg-accent text-accent-foreground shadow-[0_8px_22px_rgb(59_130_246/22%)] transition hover:bg-accent-hover"
                type="button"
                onClick={onOpenBoard}
              >
                <LayoutDashboard aria-hidden="true" size={20} />
              </button>
            </Tooltip>

            <div className="hidden md:block">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {APP_NAME}
              </p>
              <p className="text-xs text-text-muted">Локальные проекты</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 sm:max-w-xl">{children}</div>

        {/* Desktop: отдельные группы инструментов */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <div className={desktopIconGroupClass}>
            <span
              aria-live="polite"
              className={cn(
                "inline-flex w-48 shrink-0 items-center gap-1.5 truncate text-xs font-medium",
                isPersistenceError ? "text-red-300" : "text-text-muted",
              )}
              role="status"
              title={persistenceLabel}
            >
              <Cloud aria-hidden="true" className="shrink-0" size={15} />
              <span className="min-w-0 truncate">{persistenceLabel}</span>
            </span>
          </div>

          {onUndo || onRedo || onOpenCommands ? (
            <div className={desktopIconGroupClass}>
              {onUndo ? (
                <Tooltip label="Отменить действие">
                  <IconButton
                    disabled={!canUndo}
                    className={desktopIconClass}
                    label="Отменить действие"
                    size="sm"
                    onClick={onUndo}
                  >
                    <Undo2 aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}

              {onRedo ? (
                <Tooltip label="Повторить действие">
                  <IconButton
                    disabled={!canRedo}
                    className={desktopIconClass}
                    label="Повторить действие"
                    size="sm"
                    onClick={onRedo}
                  >
                    <Redo2 aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}

              {onOpenCommands ? (
                <Tooltip label="Командная палитра">
                  <IconButton
                    className={desktopIconClass}
                    label="Командная палитра"
                    size="sm"
                    onClick={onOpenCommands}
                  >
                    <Command aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>
          ) : null}

          <div className={desktopIconGroupClass}>
            {onOpenAnalytics ? (
              <Tooltip label="Аналитика">
                <IconButton
                  aria-pressed={activeView === "analytics"}
                  className={cn(
                    activeView === "analytics"
                      ? "bg-accent text-accent-foreground"
                      : desktopIconClass,
                  )}
                  label="Аналитика"
                  size="sm"
                  onClick={onOpenAnalytics}
                >
                  <BarChart3 aria-hidden="true" size={18} />
                </IconButton>
              </Tooltip>
            ) : null}

            {onOpenNotes ? (
              <Tooltip label="Заметки">
                <IconButton
                  aria-pressed={activeView === "notes"}
                  className={cn(
                    activeView === "notes"
                      ? "bg-accent text-accent-foreground"
                      : desktopIconClass,
                  )}
                  label="Заметки"
                  size="sm"
                  onClick={onOpenNotes}
                >
                  <FileText aria-hidden="true" size={18} />
                </IconButton>
              </Tooltip>
            ) : null}

            {onOpenMyWork ? (
              <Tooltip label="Мои задачи">
                <IconButton
                  aria-pressed={activeView === "my-work"}
                  className={cn(
                    activeView === "my-work"
                      ? "bg-accent text-accent-foreground"
                      : desktopIconClass,
                  )}
                  label="Мои задачи"
                  size="sm"
                  onClick={onOpenMyWork}
                >
                  <ClipboardList aria-hidden="true" size={18} />
                </IconButton>
              </Tooltip>
            ) : null}

            <Tooltip label="Календарь">
              <IconButton
                aria-pressed={activeView === "calendar"}
                className={cn(
                  activeView === "calendar"
                    ? "bg-accent text-accent-foreground"
                    : desktopIconClass,
                )}
                label="Календарь"
                size="sm"
                onClick={onOpenCalendar}
              >
                <CalendarDays aria-hidden="true" size={18} />
              </IconButton>
            </Tooltip>
          </div>

          {onToggleFilters || onToggleArchive || onOpenWorkspaceData ? (
            <div className={desktopIconGroupClass}>
              {onToggleFilters ? (
                <Tooltip label={filtersLabel}>
                  <IconButton
                    aria-pressed={isFiltersOpen}
                    className={cn(
                      isFiltersOpen
                        ? "bg-accent text-accent-foreground"
                        : desktopIconClass,
                    )}
                    label={filtersLabel}
                    size="sm"
                    onClick={onToggleFilters}
                  >
                    <ListFilter aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}

              {onToggleArchive ? (
                <Tooltip label="Архив">
                  <IconButton
                    aria-pressed={isArchiveOpen}
                    className={cn(
                      isArchiveOpen
                        ? "bg-accent text-accent-foreground"
                        : desktopIconClass,
                    )}
                    label="Архив"
                    size="sm"
                    onClick={onToggleArchive}
                  >
                    <Archive aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}

              {onOpenWorkspaceData ? (
                <Tooltip label={workspaceDataLabel}>
                  <IconButton
                    className={desktopIconClass}
                    label={workspaceDataLabel}
                    size="sm"
                    onClick={onOpenWorkspaceData}
                  >
                    <Download aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>
          ) : null}

          {onToggleBoardTools || onToggleAppearance ? (
            <div className="flex items-center gap-1">
              {onToggleBoardTools ? (
                <Tooltip label="Инструменты доски">
                  <IconButton
                    aria-pressed={isBoardToolsOpen}
                    className={cn(
                      isBoardToolsOpen
                        ? "bg-accent text-accent-foreground"
                        : desktopIconClass,
                    )}
                    label="Инструменты доски"
                    size="sm"
                    onClick={onToggleBoardTools}
                  >
                    <Settings2 aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}

              {onToggleAppearance ? (
                <Tooltip label="Оформление доски">
                  <IconButton
                    aria-pressed={isAppearanceOpen}
                    className={cn(
                      isAppearanceOpen
                        ? "bg-accent text-accent-foreground"
                        : desktopIconClass,
                    )}
                    label="Оформление доски"
                    size="sm"
                    onClick={onToggleAppearance}
                  >
                    <Palette aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Mobile / tablet: компактное меню до 1024px */}
        <div ref={actionsMenuRef} className="relative shrink-0 lg:hidden">
          <IconButton
            aria-expanded={isActionsMenuOpen}
            aria-haspopup="menu"
            className={cn(
              "size-11 sm:size-10",
              isActionsMenuOpen
                ? "bg-accent text-accent-foreground"
                : "text-text-muted hover:bg-control hover:text-text",
            )}
            label={
              isActionsMenuOpen
                ? "Закрыть меню инструментов"
                : "Открыть меню инструментов"
            }
            size="lg"
            onClick={() => setIsActionsMenuOpen((current) => !current)}
          >
            <MoreHorizontal aria-hidden="true" size={21} />
          </IconButton>

          {isActionsMenuOpen ? (
            <div
              aria-label="Инструменты проекта"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-60 max-h-[calc(100dvh-5.5rem)] w-[min(92vw,22rem)] overflow-y-auto rounded-2xl border border-white/10 bg-panel/98 p-2 shadow-2xl backdrop-blur-xl scrollbar-none"
              role="menu"
            >
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                Навигация
              </p>

              <HeaderMenuItem
                active={activeView === "board"}
                icon={<LayoutDashboard aria-hidden="true" size={18} />}
                label="Рабочая доска"
                onSelect={() => selectMenuAction(onOpenBoard)}
              />

              <HeaderMenuItem
                active={activeView === "calendar"}
                icon={<CalendarDays aria-hidden="true" size={18} />}
                label="Календарь"
                onSelect={() => selectMenuAction(onOpenCalendar)}
              />

              {onOpenAnalytics ? (
                <HeaderMenuItem
                  active={activeView === "analytics"}
                  icon={<BarChart3 aria-hidden="true" size={18} />}
                  label="Аналитика"
                  onSelect={() => selectMenuAction(onOpenAnalytics)}
                />
              ) : null}

              {onOpenNotes ? (
                <HeaderMenuItem
                  active={activeView === "notes"}
                  icon={<FileText aria-hidden="true" size={18} />}
                  label="Заметки"
                  onSelect={() => selectMenuAction(onOpenNotes)}
                />
              ) : null}

              {onOpenMyWork ? (
                <HeaderMenuItem
                  active={activeView === "my-work"}
                  icon={<ClipboardList aria-hidden="true" size={18} />}
                  label="Мои задачи"
                  onSelect={() => selectMenuAction(onOpenMyWork)}
                />
              ) : null}

              <div className="my-2 border-t border-white/10" />

              {onOpenCommands ? (
                <HeaderMenuItem
                  icon={<Command aria-hidden="true" size={18} />}
                  label="Командная палитра"
                  shortcut="⌘K"
                  onSelect={() => selectMenuAction(onOpenCommands)}
                />
              ) : null}

              {onUndo ? (
                <HeaderMenuItem
                  disabled={!canUndo}
                  icon={<Undo2 aria-hidden="true" size={18} />}
                  label="Отменить действие"
                  shortcut="⌘Z"
                  onSelect={() => selectMenuAction(onUndo)}
                />
              ) : null}

              {onRedo ? (
                <HeaderMenuItem
                  disabled={!canRedo}
                  icon={<Redo2 aria-hidden="true" size={18} />}
                  label="Повторить действие"
                  shortcut="⇧⌘Z"
                  onSelect={() => selectMenuAction(onRedo)}
                />
              ) : null}

              {onToggleFilters ||
              onToggleBoardTools ||
              onToggleArchive ||
              onOpenWorkspaceData ||
              onToggleAppearance ? (
                <>
                  <div className="my-2 border-t border-white/10" />

                  <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    {dataGroupLabel}
                  </p>
                </>
              ) : null}

              {onToggleFilters ? (
                <HeaderMenuItem
                  active={isFiltersOpen}
                  badge={activeFiltersCount || undefined}
                  icon={<ListFilter aria-hidden="true" size={18} />}
                  label={filtersLabel}
                  onSelect={() => selectMenuAction(onToggleFilters)}
                />
              ) : null}

              {onToggleBoardTools ? (
                <HeaderMenuItem
                  active={isBoardToolsOpen}
                  icon={<Settings2 aria-hidden="true" size={18} />}
                  label="Инструменты доски"
                  onSelect={() => selectMenuAction(onToggleBoardTools)}
                />
              ) : null}

              {onToggleArchive ? (
                <HeaderMenuItem
                  active={isArchiveOpen}
                  icon={<Archive aria-hidden="true" size={18} />}
                  label="Архив"
                  onSelect={() => selectMenuAction(onToggleArchive)}
                />
              ) : null}

              {onOpenWorkspaceData ? (
                <HeaderMenuItem
                  icon={<Download aria-hidden="true" size={18} />}
                  label={workspaceDataLabel}
                  onSelect={() => selectMenuAction(onOpenWorkspaceData)}
                />
              ) : null}

              {onToggleAppearance ? (
                <HeaderMenuItem
                  active={isAppearanceOpen}
                  icon={<Palette aria-hidden="true" size={18} />}
                  label="Оформление доски"
                  onSelect={() => selectMenuAction(onToggleAppearance)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
