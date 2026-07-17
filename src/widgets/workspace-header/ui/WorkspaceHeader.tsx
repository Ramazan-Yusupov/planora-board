"use client";

import {
  Archive,
  BarChart3,
  CalendarDays,
  ClipboardList,
  ClipboardCheck,
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
  ShieldCheck,
  Settings2,
  PenTool,
  Undo2,
  AlignCenter,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import { APP_NAME } from "@/shared/config/app";
import { cn } from "@/shared/lib";
import { IconButton, Text, Tooltip, useKeyboardListNavigation } from "@/shared/ui";

export type WorkspaceView =
  | "board"
  | "calendar"
  | "analytics"
  | "draw"
  | "my-work"
  | "notes"
  | "task-review";

type WorkspaceHeaderProps = Readonly<{
  activeView: WorkspaceView;
  children: ReactNode;
  activeFiltersCount?: number;
  canRedo?: boolean;
  canUndo?: boolean;
  dataToolsGroupLabel?: string;
  healthCheckIssuesCount?: number;
  isAppearanceOpen?: boolean;
  isArchiveOpen?: boolean;
  isFiltersOpen?: boolean;
  isHealthCheckOpen?: boolean;
  isBoardToolsOpen?: boolean;
  isPersistenceError: boolean;
  isProjectsOpen: boolean;
  persistenceLabel: string;
  showProjectsButton?: boolean;
  taskReviewIssuesCount?: number;
  onOpenBoard: () => void;
  onOpenAnalytics?: () => void;
  onOpenCalendar: () => void;
  onOpenDraw?: () => void;
  onOpenMyWork?: () => void;
  onOpenNotes?: () => void;
  onOpenTaskReview?: () => void;
  onOpenCommands?: () => void;
  onOpenHealthCheck?: () => void;
  onOpenWorkspaceCenter?: () => void;
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
  isKeyboardActive?: boolean;
  itemProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  shortcut?: string;
}>;

function HeaderMenuItem({
  icon,
  label,
  onSelect,
  active = false,
  badge,
  disabled = false,
  isKeyboardActive = false,
  itemProps,
  shortcut,
}: HeaderMenuItemProps) {
  return (
    <button
      {...itemProps}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
        active || isKeyboardActive
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

      <Text tag="span" text={label} variant="menuLabel" />

      {shortcut ? (
        <Text
          tag="span"
          className={cn(
            active
              ? "border-accent-foreground/30 text-accent-foreground/80"
              : "border-white/10 text-text-muted",
          )}
          text={shortcut}
          variant="shortcut"
        />
      ) : null}

      {badge ? (
        <Text
          tag="span"
          className={cn(
            active
              ? "bg-accent-foreground text-accent"
              : "bg-danger text-slate-950",
          )}
          text={badge}
          variant="badge"
        />
      ) : null}
    </button>
  );
}

type HeaderMenuAction = Readonly<{
  active?: boolean;
  badge?: number;
  disabled?: boolean;
  icon: ReactNode;
  id: string;
  label: string;
  onSelect: () => void;
  shortcut?: string;
}>;

type HeaderMenuSection = Readonly<{
  actions: readonly HeaderMenuAction[];
  id: string;
  title?: string;
}>;

export function WorkspaceHeader({
  activeView,
  children,
  activeFiltersCount = 0,
  canRedo = false,
  canUndo = false,
  dataToolsGroupLabel,
  healthCheckIssuesCount = 0,
  isAppearanceOpen = false,
  isArchiveOpen = false,
  isFiltersOpen = false,
  isHealthCheckOpen = false,
  isBoardToolsOpen = false,
  isPersistenceError,
  isProjectsOpen,
  persistenceLabel,
  showProjectsButton = true,
  taskReviewIssuesCount = 0,
  onOpenBoard,
  onOpenAnalytics,
  onOpenCalendar,
  onOpenDraw,
  onOpenMyWork,
  onOpenNotes,
  onOpenTaskReview,
  onOpenCommands,
  onOpenHealthCheck,
  onOpenWorkspaceCenter,
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
  const healthCheckLabel = healthCheckIssuesCount
    ? `Диагностика: ${healthCheckIssuesCount} проблем`
    : "Диагностика workspace";
  const dataGroupLabel =
    dataToolsGroupLabel ?? (activeView === "board" ? "Доска" : "Данные");

  const desktopIconClass =
    "rounded-xl text-text-muted hover:bg-control/85 hover:text-text hover:shadow-[inset_0_1px_0_rgb(255_255_255/4%)]";
  const desktopIconGroupClass =
    "flex items-center gap-1 border-r border-white/10 pr-2";
  const selectMenuAction = useCallback((action: (() => void) | undefined) => {
    action?.();
    setIsActionsMenuOpen(false);
  }, []);
  const mobileMenuSections = useMemo<readonly HeaderMenuSection[]>(() => {
    const navigationActions: HeaderMenuAction[] = [
      {
        active: activeView === "board",
        icon: <LayoutDashboard aria-hidden="true" size={18} />,
        id: "board",
        label: "Рабочая доска",
        onSelect: onOpenBoard,
      },
      {
        active: activeView === "calendar",
        icon: <CalendarDays aria-hidden="true" size={18} />,
        id: "calendar",
        label: "Календарь",
        onSelect: onOpenCalendar,
      },
    ];

    if (onOpenAnalytics) {
      navigationActions.push({
        active: activeView === "analytics",
        icon: <BarChart3 aria-hidden="true" size={18} />,
        id: "analytics",
        label: "Аналитика",
        onSelect: onOpenAnalytics,
      });
    }

    if (onOpenNotes) {
      navigationActions.push({
        active: activeView === "notes",
        icon: <FileText aria-hidden="true" size={18} />,
        id: "notes",
        label: "Заметки",
        onSelect: onOpenNotes,
      });
    }

    if (onOpenDraw) {
      navigationActions.push({
        active: activeView === "draw",
        icon: <PenTool aria-hidden="true" size={18} />,
        id: "draw",
        label: "DrawTool",
        onSelect: onOpenDraw,
      });
    }

    if (onOpenMyWork) {
      navigationActions.push({
        active: activeView === "my-work",
        icon: <ClipboardList aria-hidden="true" size={18} />,
        id: "my-work",
        label: "Мои задачи",
        onSelect: onOpenMyWork,
      });
    }

    if (onOpenTaskReview) {
      navigationActions.push({
        active: activeView === "task-review",
        badge: taskReviewIssuesCount || undefined,
        icon: <ClipboardCheck aria-hidden="true" size={18} />,
        id: "task-review",
        label: "Обзор задач",
        onSelect: onOpenTaskReview,
      });
    }

    const commandActions: HeaderMenuAction[] = [];

    if (onOpenCommands) {
      commandActions.push({
        icon: <Command aria-hidden="true" size={18} />,
        id: "commands",
        label: "Командная палитра",
        onSelect: onOpenCommands,
        shortcut: "⌘K",
      });
    }

    if (onUndo) {
      commandActions.push({
        disabled: !canUndo,
        icon: <Undo2 aria-hidden="true" size={18} />,
        id: "undo",
        label: "Отменить действие",
        onSelect: onUndo,
        shortcut: "⌘Z",
      });
    }

    if (onRedo) {
      commandActions.push({
        disabled: !canRedo,
        icon: <Redo2 aria-hidden="true" size={18} />,
        id: "redo",
        label: "Повторить действие",
        onSelect: onRedo,
        shortcut: "⇧⌘Z",
      });
    }

    const dataActions: HeaderMenuAction[] = [];

    if (onToggleFilters) {
      dataActions.push({
        active: isFiltersOpen,
        badge: activeFiltersCount || undefined,
        icon: <ListFilter aria-hidden="true" size={18} />,
        id: "filters",
        label: filtersLabel,
        onSelect: onToggleFilters,
      });
    }

    if (onToggleBoardTools) {
      dataActions.push({
        active: isBoardToolsOpen,
        icon: <Settings2 aria-hidden="true" size={18} />,
        id: "board-tools",
        label: "Инструменты доски",
        onSelect: onToggleBoardTools,
      });
    }

    if (onToggleArchive) {
      dataActions.push({
        active: isArchiveOpen,
        icon: <Archive aria-hidden="true" size={18} />,
        id: "archive",
        label: "Архив",
        onSelect: onToggleArchive,
      });
    }

    if (onOpenHealthCheck) {
      dataActions.push({
        active: isHealthCheckOpen,
        badge: healthCheckIssuesCount || undefined,
        icon: <ShieldCheck aria-hidden="true" size={18} />,
        id: "health",
        label: healthCheckLabel,
        onSelect: onOpenHealthCheck,
      });
    }

    if (onOpenWorkspaceCenter) {
      dataActions.push({
        icon: <Command aria-hidden="true" size={18} />,
        id: "workspace-center",
        label: "Workspace Center",
        onSelect: onOpenWorkspaceCenter,
      });
    }

    if (onOpenWorkspaceData) {
      dataActions.push({
        icon: <Download aria-hidden="true" size={18} />,
        id: "workspace-data",
        label: workspaceDataLabel,
        onSelect: onOpenWorkspaceData,
      });
    }

    if (onToggleAppearance) {
      dataActions.push({
        active: isAppearanceOpen,
        icon: <Palette aria-hidden="true" size={18} />,
        id: "appearance",
        label: "Оформление доски",
        onSelect: onToggleAppearance,
      });
    }

    return [
      { actions: navigationActions, id: "navigation", title: "Навигация" },
      { actions: commandActions, id: "commands" },
      { actions: dataActions, id: "data", title: dataGroupLabel },
    ].filter((section) => section.actions.length > 0);
  }, [
    activeFiltersCount,
    activeView,
    canRedo,
    canUndo,
    dataGroupLabel,
    filtersLabel,
    healthCheckIssuesCount,
    healthCheckLabel,
    isAppearanceOpen,
    isArchiveOpen,
    isBoardToolsOpen,
    isFiltersOpen,
    isHealthCheckOpen,
    onOpenAnalytics,
    onOpenBoard,
    onOpenCalendar,
    onOpenDraw,
    onOpenCommands,
    onOpenHealthCheck,
    onOpenMyWork,
    onOpenNotes,
    onOpenTaskReview,
    taskReviewIssuesCount,
    onOpenWorkspaceCenter,
    onOpenWorkspaceData,
    onRedo,
    onToggleAppearance,
    onToggleArchive,
    onToggleBoardTools,
    onToggleFilters,
    onUndo,
    workspaceDataLabel,
  ]);
  const mobileMenuActions = useMemo(
    () => mobileMenuSections.flatMap((section) => section.actions),
    [mobileMenuSections],
  );
  const selectMobileMenuAction = useCallback(
    (index: number) => {
      const action = mobileMenuActions[index];

      if (!action || action.disabled) {
        return;
      }

      selectMenuAction(action.onSelect);
    },
    [mobileMenuActions, selectMenuAction],
  );
  const isMobileMenuActionDisabled = useCallback(
    (index: number) => Boolean(mobileMenuActions[index]?.disabled),
    [mobileMenuActions],
  );
  const {
    activeIndex: activeMobileMenuIndex,
    activeItemId: activeMobileMenuItemId,
    getItemProps: getMobileMenuItemProps,
    handleKeyDown: handleMobileMenuKeyDown,
  } = useKeyboardListNavigation({
    count: mobileMenuActions.length,
    getItemId: (index) =>
      `workspace-header-action-${mobileMenuActions[index]?.id ?? index}`,
    isItemDisabled: isMobileMenuActionDisabled,
    onClose: () => setIsActionsMenuOpen(false),
    onSelect: selectMobileMenuAction,
  });

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

    const handleNavigationKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "PageDown" ||
        event.key === "PageUp" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === "Enter" ||
        event.key === "Escape"
      ) {
        handleMobileMenuKeyDown(event);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    document.addEventListener("keydown", handleNavigationKeyDown);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
      document.removeEventListener("keydown", handleNavigationKeyDown);
    };
  }, [handleMobileMenuKeyDown, isActionsMenuOpen]);

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

  return (
    <header className="z-50 border-b border-white/10 bg-panel/88 px-2 py-2 shadow-[0_1px_0_rgb(255_255_255/2%),0_16px_40px_rgb(0_0_0/15%)] backdrop-blur-2xl sm:px-5 sm:py-3">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-2 sm:gap-3">
        <div className="flex">
          {showProjectsButton ? (
            <IconButton
              aria-pressed={isProjectsOpen}
              className="size-11 text-text-muted hover:bg-control hover:text-text sm:size-10"
              label={isProjectsOpen ? "Закрыть проекты" : "Открыть проекты"}
              size="lg"
              onClick={onToggleProjects}
            >
              <Menu aria-hidden="true" size={20} />
            </IconButton>
          ) : null}

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
              <Text
                className="tracking-[0.14em] text-accent"
                text={APP_NAME}
                variant="eyebrow"
              />
              <Text text="Локальные проекты" variant="caption" />
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 sm:max-w-xl">{children}</div>

        {/* Desktop: отдельные группы инструментов */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <div className={desktopIconGroupClass}>
            <Text
              tag="span"
              aria-live="polite"
              className={cn(
                "inline-flex w-48 shrink-0 items-center gap-1.5 truncate text-xs font-medium",
                isPersistenceError ? "text-red-300" : "text-text-muted",
              )}
              role="status"
              title={persistenceLabel}
            >
              <Cloud aria-hidden="true" className="shrink-0" size={15} />
              <Text
                tag="span"
                className="min-w-0 truncate"
                text={persistenceLabel}
              />
            </Text>
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

            {onOpenDraw ? (
              <Tooltip label="DrawTool">
                <IconButton
                  aria-pressed={activeView === "draw"}
                  className={cn(
                    activeView === "draw"
                      ? "bg-accent text-accent-foreground"
                      : desktopIconClass,
                  )}
                  label="DrawTool"
                  size="sm"
                  onClick={onOpenDraw}
                >
                  <PenTool aria-hidden="true" size={18} />
                </IconButton>
              </Tooltip>
            ) : null}

            {onOpenTaskReview ? (
              <Tooltip
                label={
                  taskReviewIssuesCount
                    ? `Обзор задач: ${taskReviewIssuesCount} рисков`
                    : "Обзор задач"
                }
              >
                <IconButton
                  aria-pressed={activeView === "task-review"}
                  className={cn(
                    activeView === "task-review"
                      ? "bg-accent text-accent-foreground"
                      : desktopIconClass,
                  )}
                  label="Обзор задач"
                  size="sm"
                  onClick={onOpenTaskReview}
                >
                  <ClipboardCheck aria-hidden="true" size={18} />
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

          {onToggleFilters ||
          onToggleArchive ||
          onOpenWorkspaceData ||
          onOpenWorkspaceCenter ||
          onOpenHealthCheck ? (
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

              {onOpenHealthCheck ? (
                <Tooltip label={healthCheckLabel}>
                  <IconButton
                    aria-pressed={isHealthCheckOpen}
                    className={cn(
                      isHealthCheckOpen
                        ? "bg-accent text-accent-foreground"
                        : desktopIconClass,
                    )}
                    label={healthCheckLabel}
                    size="sm"
                    onClick={onOpenHealthCheck}
                  >
                    <ShieldCheck aria-hidden="true" size={18} />
                  </IconButton>
                </Tooltip>
              ) : null}

              {onOpenWorkspaceCenter ? (
                <Tooltip label="Workspace Center">
                  <IconButton
                    className={desktopIconClass}
                    label="Workspace Center"
                    size="sm"
                    onClick={onOpenWorkspaceCenter}
                  >
                    <AlignCenter aria-hidden="true" size={18} />
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
              aria-activedescendant={activeMobileMenuItemId}
              aria-label="Инструменты проекта"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-60 max-h-[calc(100dvh-5.5rem)] w-[min(92vw,22rem)] overflow-y-auto rounded-2xl border border-white/10 bg-panel/98 p-2 shadow-2xl backdrop-blur-xl scrollbar-none"
              role="menu"
              tabIndex={-1}
              onKeyDown={handleMobileMenuKeyDown}
            >
              {mobileMenuSections.map((section, sectionIndex) => {
                const sectionOffset = mobileMenuSections
                  .slice(0, sectionIndex)
                  .reduce((count, current) => count + current.actions.length, 0);

                return (
                  <div key={section.id}>
                    {sectionIndex > 0 ? (
                      <div className="my-2 border-t border-white/10" />
                    ) : null}

                    {section.title ? (
                      <Text
                        className="px-3 pb-2 pt-1"
                        text={section.title}
                        variant="eyebrow"
                      />
                    ) : null}

                    {section.actions.map((action, actionIndex) => {
                      const itemIndex = sectionOffset + actionIndex;

                      return (
                        <HeaderMenuItem
                          key={action.id}
                          active={action.active}
                          badge={action.badge}
                          disabled={action.disabled}
                          icon={action.icon}
                          isKeyboardActive={activeMobileMenuIndex === itemIndex}
                          itemProps={getMobileMenuItemProps(itemIndex)}
                          label={action.label}
                          shortcut={action.shortcut}
                          onSelect={() => selectMenuAction(action.onSelect)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
