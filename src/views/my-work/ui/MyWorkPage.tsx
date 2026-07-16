"use client";

import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FolderKanban,
  ListChecks,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  CARD_PRIORITY_OPTIONS,
  CARD_STATUS_OPTIONS,
  type Board,
  type BoardCard,
  type CardDraft,
  type CardPriority,
  type CardStatus,
} from "@/entities/board";
import { updateCard } from "@/features/board-management";
import { useBoardWorkspace } from "@/features/manage-board-workspace";
import { loadNotes, type Note } from "@/features/manage-notes";
import {
  ANALYTICS_ROUTE,
  CALENDAR_ROUTE,
  DRAW_ROUTE,
  MY_WORK_ROUTE,
  NOTES_ROUTE,
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
import { WorkspaceHeader } from "@/widgets/workspace-header";

type MyWorkItem = Readonly<{
  board: Board;
  card: BoardCard;
  listTitle: string;
}>;

type MyWorkGroup = Readonly<{
  id: "overdue" | "today" | "next7Days" | "noDate";
  title: string;
  description: string;
  items: MyWorkItem[];
  tone: "danger" | "warning" | "info" | "muted";
}>;

type ScheduleGroupId = MyWorkGroup["id"];
const scheduleGroupIds: readonly ScheduleGroupId[] = [
  "overdue",
  "today",
  "next7Days",
  "noDate",
];

function isScheduleGroupId(value: string): value is ScheduleGroupId {
  return scheduleGroupIds.includes(value as ScheduleGroupId);
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function getDueDateForGroup(groupId: ScheduleGroupId): string | undefined {
  const today = new Date();

  if (groupId === "overdue") {
    return getDateKey(addDays(today, -1));
  }

  if (groupId === "today") {
    return getDateKey(today);
  }

  if (groupId === "next7Days") {
    return getDateKey(addDays(today, 7));
  }

  return undefined;
}

function createCardDraftWithDueDate(
  card: BoardCard,
  dueDate: string | undefined,
): CardDraft {
  return {
    title: card.title,
    description: card.description,
    status: card.status,
    priority: card.priority,
    startDate: card.startDate,
    dueDate,
    labelIds: [...card.labelIds],
    customFields: card.customFields.map((field) => ({ ...field })),
    sticker: card.sticker,
    cover: card.cover,
  };
}

function formatDueDate(dateKey: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function getStatusLabel(status: CardStatus, board: Board): string {
  return (
    board.cardStatusLabels[status] ??
    CARD_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    board.cardStatuses.find((option) => option.id === status)?.name ??
    status
  );
}

function getPriorityLabel(priority: CardPriority, board: Board): string {
  return (
    board.cardPriorityLabels[priority] ??
    CARD_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ??
    board.cardPriorities.find((option) => option.id === priority)?.name ??
    priority
  );
}

function getActiveItems(boards: readonly Board[]): MyWorkItem[] {
  return boards.flatMap((board) =>
    board.listIds.flatMap((listId) => {
      const list = board.lists[listId];

      if (!list || list.isArchived) {
        return [];
      }

      return list.cardIds.flatMap((cardId) => {
        const card = board.cards[cardId];

        if (!card || card.isArchived || card.status === "done") {
          return [];
        }

        return [{ board, card, listTitle: list.title }];
      });
    }),
  );
}

function buildGroups(items: readonly MyWorkItem[], today = new Date()) {
  const todayKey = getDateKey(today);
  const nextWeekKey = getDateKey(addDays(today, 7));
  const sortedItems = [...items].sort((left, right) => {
    const leftDate = left.card.dueDate ?? "9999-12-31";
    const rightDate = right.card.dueDate ?? "9999-12-31";

    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }

    return right.card.updatedAt - left.card.updatedAt;
  });

  const overdue: MyWorkItem[] = [];
  const todayItems: MyWorkItem[] = [];
  const next7Days: MyWorkItem[] = [];
  const noDate: MyWorkItem[] = [];

  for (const item of sortedItems) {
    const dueDate = item.card.dueDate;

    if (!dueDate) {
      noDate.push(item);
    } else if (dueDate < todayKey) {
      overdue.push(item);
    } else if (dueDate === todayKey) {
      todayItems.push(item);
    } else if (dueDate <= nextWeekKey) {
      next7Days.push(item);
    }
  }

  return [
    {
      id: "overdue",
      title: "Просрочено",
      description: "Невыполненные карточки со сроком в прошлом.",
      items: overdue,
      tone: "danger",
    },
    {
      id: "today",
      title: "Сегодня",
      description: "Карточки, которые нужно закрыть сегодня.",
      items: todayItems,
      tone: "warning",
    },
    {
      id: "next7Days",
      title: "Ближайшие 7 дней",
      description: "Работа на ближайшую неделю.",
      items: next7Days,
      tone: "info",
    },
    {
      id: "noDate",
      title: "Без срока",
      description: "Активные карточки без дедлайна.",
      items: noDate,
      tone: "muted",
    },
  ] satisfies MyWorkGroup[];
}

function MyWorkLoadingState() {
  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
      <p
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
      >
        Загружаем мои задачи…
      </p>
    </main>
  );
}

function GroupIcon({ tone }: Readonly<{ tone: MyWorkGroup["tone"] }>) {
  const className = cn(
    "grid size-10 shrink-0 place-items-center rounded-lg",
    tone === "danger" && "bg-red-500/14 text-red-200",
    tone === "warning" && "bg-amber-400/14 text-amber-100",
    tone === "info" && "bg-sky-400/14 text-sky-100",
    tone === "muted" && "bg-white/8 text-text-muted",
  );

  if (tone === "danger") {
    return (
      <span className={className}>
        <Clock3 aria-hidden="true" size={18} />
      </span>
    );
  }

  if (tone === "warning") {
    return (
      <span className={className}>
        <CalendarDays aria-hidden="true" size={18} />
      </span>
    );
  }

  if (tone === "info") {
    return (
      <span className={className}>
        <ListChecks aria-hidden="true" size={18} />
      </span>
    );
  }

  return (
    <span className={className}>
      <Circle aria-hidden="true" size={18} />
    </span>
  );
}

function WorkCard({
  item,
  isOverlay = false,
  onOpen,
}: Readonly<{
  item: MyWorkItem;
  isOverlay?: boolean;
  onOpen: (item: MyWorkItem) => void;
}>) {
  const { board, card, listTitle } = item;
  const statusLabel = getStatusLabel(card.status, board);
  const priorityLabel = getPriorityLabel(card.priority, board);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${board.id}:${card.id}`,
      data: {
        boardId: board.id,
        cardId: card.id,
        type: "my-work-card",
      },
      disabled: isOverlay,
    });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-lg border border-white/10 bg-control/30 p-3 text-left transition hover:border-accent/40 hover:bg-control/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-35",
        isOverlay && "w-80 shadow-2xl",
      )}
      type="button"
      onClick={() => onOpen(item)}
      {...listeners}
      {...attributes}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-panel/70 text-text-muted">
          <FolderKanban aria-hidden="true" size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="block max-w-full truncate text-sm font-semibold text-text">
            {card.title}
          </p>
          <p className="mt-1 block max-w-full truncate text-xs text-text-muted">
            {board.title} / {listTitle}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {card.dueDate ? (
          <span className="inline-flex min-h-7 items-center gap-1 rounded-md border border-white/10 bg-black/12 px-2 text-[11px] font-semibold tabular-nums text-text">
            <CalendarDays aria-hidden="true" size={13} />
            {formatDueDate(card.dueDate)}
          </span>
        ) : null}

        {card.status !== "none" ? (
          <span className="inline-flex min-h-7 max-w-full items-center rounded-md border border-white/10 bg-black/12 px-2 text-[11px] font-medium text-text-muted">
            <span className="max-w-28 truncate">{statusLabel}</span>
          </span>
        ) : null}

        {card.priority !== "none" ? (
          <span className="inline-flex min-h-7 max-w-full items-center rounded-md border border-white/10 bg-black/12 px-2 text-[11px] font-medium text-text-muted">
            <span className="max-w-28 truncate">{priorityLabel}</span>
          </span>
        ) : null}

        {card.checklistIds.length > 0 ? (
          <span className="inline-flex min-h-7 items-center gap-1 rounded-md border border-white/10 bg-black/12 px-2 text-[11px] font-medium tabular-nums text-text-muted">
            <CheckCircle2 aria-hidden="true" size={13} />
            {card.checklistIds.length}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function WorkGroupColumn({
  group,
  onOpen,
}: Readonly<{
  group: MyWorkGroup;
  onOpen: (item: MyWorkItem) => void;
}>) {
  const { isOver, setNodeRef } = useDroppable({
    id: group.id,
    data: {
      groupId: group.id,
      type: "my-work-group",
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[18rem] flex-col rounded-lg border border-white/10 bg-panel/62 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)] transition",
        isOver && "border-accent/55 bg-accent/8 ring-1 ring-accent/35",
      )}
    >
      <header className="flex items-start gap-3 border-b border-white/10 pb-3">
        <GroupIcon tone={group.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-sm font-semibold text-text">
              {group.title}
            </h2>
            <span className="rounded-md bg-control px-1.5 py-0.5 text-xs font-semibold tabular-nums text-text-muted">
              {group.items.length}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            {group.description}
          </p>
        </div>
      </header>

      <div className="mt-3 grid min-w-0 gap-2 overflow-hidden">
        {group.items.length > 0 ? (
          group.items.map((item) => (
            <WorkCard
              key={`${item.board.id}-${item.card.id}`}
              item={item}
              onOpen={onOpen}
            />
          ))
        ) : (
          <p className="grid min-h-24 place-items-center rounded-lg border border-dashed border-white/14 bg-control/20 px-3 text-center text-xs leading-5 text-text-muted">
            Перетащите карточку сюда, чтобы изменить срок.
          </p>
        )}
      </div>
    </section>
  );
}

export function MyWorkPage() {
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
    updateBoard,
  } = useBoardWorkspace();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<MyWorkItem | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notesSnapshot, setNotesSnapshot] = useState<Note[]>([]);
  const openCommandPalette = useCallback(() => {
    setNotesSnapshot(loadNotes());
    setIsCommandPaletteOpen(true);
  }, []);
  useCommandPaletteShortcut(openCommandPalette);
  const groups = useMemo(
    () => (activeBoard ? buildGroups(getActiveItems([activeBoard])) : []),
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

  if (!isReady || !workspace || !activeBoard) {
    return <MyWorkLoadingState />;
  }

  const totalVisibleCards = groups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
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

  const openWorkItem = (item: MyWorkItem) => {
    selectProject(item.board.id);
    router.push(getBoardRoute(item.board.id, item.card.id));
  };
  const myWorkTaskActions = groups.flatMap((group) =>
    group.items.map((item) => ({
      id: `my-work-card-${item.board.id}-${item.card.id}`,
      label: item.card.title,
      description: `${group.title} · ${item.board.title} / ${item.listTitle}`,
      icon: <ListChecks aria-hidden="true" size={18} />,
      onSelect: () => openWorkItem(item),
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
    }),
    ...myWorkTaskActions,
    ...getWorkspaceSearchActions({
      activeBoardId: activeBoard.id,
      notes: notesSnapshot,
      workspace,
      onOpenBoard: openBoard,
      onOpenCard: openWorkspaceCard,
      onOpenNote: openWorkspaceNote,
    }),
  ];

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);

    const activeData = event.active.data.current;
    const overData = event.over?.data.current;

    if (
      activeData?.type !== "my-work-card" ||
      overData?.type !== "my-work-group"
    ) {
      return;
    }

    const boardId = activeData.boardId;
    const cardId = activeData.cardId;
    const groupId = overData.groupId;

    if (
      typeof boardId !== "string" ||
      typeof cardId !== "string" ||
      typeof groupId !== "string" ||
      !isScheduleGroupId(groupId)
    ) {
      return;
    }

    updateBoard(
      boardId,
      (board) => {
        const card = board.cards[cardId];

        if (!card) {
          return board;
        }

        return updateCard(
          board,
          cardId,
          createCardDraftWithDueDate(card, getDueDateForGroup(groupId)),
        );
      },
      "immediate",
    );
  };

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="my-work"
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
            <section className="rounded-lg border border-white/10 bg-panel/70 p-4 shadow-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Фокус
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text">
                    {totalVisibleCards} активных задач
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Готовые и архивные карточки здесь не показываются.
                  </p>
                </div>
                <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 bg-control/45 px-3 text-sm text-text-muted">
                  <CalendarDays aria-hidden="true" size={16} />
                  {formatDueDate(getDateKey(new Date()))}
                </span>
              </div>
            </section>

            <DndContext
              onDragCancel={() => setActiveDragItem(null)}
              onDragEnd={handleDragEnd}
              onDragStart={(event) => {
                const activeData = event.active.data.current;

                if (
                  activeData?.type !== "my-work-card" ||
                  typeof activeData.boardId !== "string" ||
                  typeof activeData.cardId !== "string"
                ) {
                  return;
                }

                const item = groups
                  .flatMap((group) => group.items)
                  .find(
                    (candidate) =>
                      candidate.board.id === activeData.boardId &&
                      candidate.card.id === activeData.cardId,
                  );

                setActiveDragItem(item ?? null);
              }}
            >
              <div className="grid min-w-0 gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
                {groups.map((group) => (
                  <WorkGroupColumn
                    key={group.id}
                    group={group}
                    onOpen={openWorkItem}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeDragItem ? (
                  <WorkCard
                    item={activeDragItem}
                    isOverlay
                    onOpen={openWorkItem}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
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
