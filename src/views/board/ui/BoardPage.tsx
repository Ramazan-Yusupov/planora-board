"use client";

import { AlertTriangle, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCardAttachments,
  getCardChecklists,
  getOrderedBoardLabels,
  resolveBoardAppearance,
  type BoardLabel,
  type BoardMember,
  type CardDraft,
} from "@/entities/board";
import { archiveCard, restoreCard } from "@/features/archive-card";
import {
  addCard,
  addList,
  archiveList,
  clearList,
  createChecklistTemplate,
  createCardPriorityOption,
  createCardStatusOption,
  createCustomFieldTemplate,
  deleteCardPriorityOption,
  deleteCardStatusOption,
  deleteChecklistTemplate,
  deleteCustomFieldTemplate,
  deleteCard,
  deleteList,
  duplicateList,
  getActiveBoardListIds,
  moveAllCards,
  moveCard,
  moveList,
  renameBoard,
  renameList,
  restoreList,
  setListWipLimit,
  updateBoardCoverColors,
  updateBoardAppearance,
  updateCard,
  updateCardPriorityOption,
  updateCardPriorityLabel,
  updateCardStatusOption,
  updateCardStatusLabel,
  updateChecklistTemplate,
  updateCustomFieldTemplate,
} from "@/features/board-management";
import { duplicateCard } from "@/features/duplicate-card";
import {
  CARD_DUE_FILTER_OPTIONS,
  CARD_PRIORITY_FILTER_OPTIONS,
  CARD_STATUS_FILTER_OPTIONS,
  DEFAULT_CARD_FILTERS,
  getActiveCardFiltersCount,
  getVisibleCardIdsByList,
  hasActiveCardFilters,
  type CardFilters,
} from "@/features/filter-cards";
import { useBoardWorkspace } from "@/features/manage-board-workspace";
import {
  loadNotes,
  replaceStoredNotes,
  type Note,
} from "@/features/manage-notes";
import { evaluateWorkspaceHealth } from "@/features/workspace-health";
import {
  addAttachmentToCard,
  removeAttachmentFromCard,
} from "@/features/manage-attachments";
import {
  createBoardMember,
  deleteBoardMember,
  updateBoardMember,
} from "@/features/manage-card-members";
import {
  createChecklist,
  createChecklistItem,
  deleteChecklist,
  deleteChecklistItem,
  moveChecklistItem,
  renameChecklist,
  renameChecklistItem,
  toggleChecklistItem,
} from "@/features/manage-checklist";
import {
  addCardComment,
  deleteCardComment,
  updateCardComment,
} from "@/features/manage-comments";
import {
  createBoardLabel,
  deleteBoardLabel,
  updateBoardLabel,
} from "@/features/manage-labels";
import {
  ANALYTICS_ROUTE,
  CALENDAR_ROUTE,
  MY_WORK_ROUTE,
  NOTES_ROUTE,
  getBoardRoute,
} from "@/shared/config/routes";
import { usePrefetchRoutes } from "@/shared/lib";
import {
  IconButton,
  TextField,
  ToastViewport,
  type ToastMessage,
  type ToastTone,
} from "@/shared/ui";
import { BoardColumns } from "@/widgets/board-columns";
import { ListActionsDialog } from "@/widgets/list-actions";
import { ProjectSwitcher } from "@/widgets/project-switcher";
import { WorkspaceHeader } from "@/widgets/workspace-header";

import { getBoardCommandActions } from "../lib/getBoardCommandActions";
import { useBoardKeyboardShortcuts } from "../lib/useBoardKeyboardShortcuts";
import { useWorkspaceCenterActions } from "../lib/useWorkspaceCenterActions";
import { BoardLoadingState } from "./BoardLoadingState";

const BoardAppearanceSidebar = dynamic(() =>
  import("@/widgets/board-appearance").then((mod) => mod.BoardAppearanceSidebar),
);
const BoardToolsSidebar = dynamic(() =>
  import("@/widgets/board-tools").then((mod) => mod.BoardToolsSidebar),
);
const CardArchiveModal = dynamic(() =>
  import("@/widgets/card-archive").then((mod) => mod.CardArchiveModal),
);
const CardFiltersSidebar = dynamic(() =>
  import("@/widgets/card-filters").then((mod) => mod.CardFiltersSidebar),
);
const CardModal = dynamic(() =>
  import("@/widgets/card-modal").then((mod) => mod.CardModal),
);
const CommandPalette = dynamic(() =>
  import("@/widgets/command-palette/ui/CommandPalette").then(
    (mod) => mod.CommandPalette,
  ),
);
const QuickCreateCardDialog = dynamic(() =>
  import("@/widgets/command-palette/ui/QuickCreateCardDialog").then(
    (mod) => mod.QuickCreateCardDialog,
  ),
);
const QuickCreateListDialog = dynamic(() =>
  import("@/widgets/command-palette/ui/QuickCreateListDialog").then(
    (mod) => mod.QuickCreateListDialog,
  ),
);
const WorkspaceCenterModal = dynamic(() =>
  import("@/widgets/workspace-center").then((mod) => mod.WorkspaceCenterModal),
);
const WorkspaceDataModal = dynamic(() =>
  import("@/widgets/workspace-data").then((mod) => mod.WorkspaceDataModal),
);
const WorkspaceHealthModal = dynamic(() =>
  import("@/widgets/workspace-health").then((mod) => mod.WorkspaceHealthModal),
);

type BoardPageProps = Readonly<{
  boardId: string;
  initialCardId?: string;
}>;

type ActiveFilterChipProps = Readonly<{
  label: string;
  onClear: () => void;
}>;

type ToastDraft = Readonly<{
  title: string;
  description?: string;
  tone?: ToastTone;
}>;

type LinkedNoteSummary = Readonly<{
  id: string;
  title: string;
  updatedAt: number;
}>;

function ActiveFilterChip({ label, onClear }: ActiveFilterChipProps) {
  return (
    <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border border-white/15 bg-slate-950/30 px-2.5 text-xs font-medium text-white/85 backdrop-blur-sm">
      <span className="min-w-0 truncate">{label}</span>
      <button
        className="-mr-1 grid size-6 shrink-0 place-items-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        type="button"
        aria-label={`Убрать фильтр: ${label}`}
        onClick={onClear}
      >
        <X aria-hidden="true" size={14} />
      </button>
    </span>
  );
}

function getOptionLabel<T extends string>(
  options: readonly Readonly<{ value: T; label: string }>[],
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getLinkedNotesForCard(
  notes: readonly Note[],
  boardId: string,
  cardId: string,
): LinkedNoteSummary[] {
  return notes
    .filter(
      (note) =>
        note.boardId === boardId &&
        note.blocks.some(
          (block) =>
            block.type === "linked-card" &&
            block.linkedCardId === cardId &&
            (!block.linkedBoardId || block.linkedBoardId === boardId),
        ),
    )
    .map((note) => ({
      id: note.id,
      title: note.title || "Без названия",
      updatedAt: note.updatedAt,
    }));
}

export function BoardPage({ boardId, initialCardId }: BoardPageProps) {
  const router = useRouter();
  const {
    workspace,
    activeBoard,
    isReady,
    persistenceState,
    storageError,
    workspaceStorage,
    isWorkspaceStorageBusy,
    connectWorkspaceFolder,
    createFolderBackup,
    disconnectWorkspaceFolder,
    canRedo,
    canUndo,
    createProject,
    deleteProject,
    redo,
    replaceWorkspace,
    selectProject,
    undo,
    updateActiveBoard,
  } = useBoardWorkspace();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isInitialCardDismissed, setIsInitialCardDismissed] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isBoardToolsOpen, setIsBoardToolsOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isQuickCreateListOpen, setIsQuickCreateListOpen] = useState(false);
  const [isWorkspaceDataOpen, setIsWorkspaceDataOpen] = useState(false);
  const [isWorkspaceCenterOpen, setIsWorkspaceCenterOpen] = useState(false);
  const [isWorkspaceHealthOpen, setIsWorkspaceHealthOpen] = useState(false);
  const [listActionsListId, setListActionsListId] = useState<string | null>(
    null,
  );
  const [cardFilters, setCardFilters] = useState<CardFilters>({
    ...DEFAULT_CARD_FILTERS,
  });
  const [notesSnapshot, setNotesSnapshot] = useState<Note[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((toastId: string) => {
    const timerId = toastTimersRef.current.get(toastId);

    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      toastTimersRef.current.delete(toastId);
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback(
    ({ title, description, tone = "info" }: ToastDraft) => {
      toastIdRef.current += 1;
      const id = `toast-${Date.now()}-${toastIdRef.current}`;
      const nextToast: ToastMessage = { id, title, description, tone };

      setToasts((current) => [...current, nextToast].slice(-4));

      const timerId = window.setTimeout(() => {
        dismissToast(id);
      }, 4500);

      toastTimersRef.current.set(id, timerId);
    },
    [dismissToast],
  );

  const workspaceCenterActions = useWorkspaceCenterActions({
    activeBoardId: activeBoard?.id ?? boardId,
    setNotesSnapshot,
    showToast,
    updateActiveBoard,
  });
  usePrefetchRoutes([
    getBoardRoute(activeBoard?.id ?? boardId),
    NOTES_ROUTE,
    CALENDAR_ROUTE,
    MY_WORK_ROUTE,
    ANALYTICS_ROUTE,
  ]);

  useEffect(() => {
    if (!isReady || !workspace || !activeBoard) {
      return;
    }

    const requestedBoardExists = workspace.boards.some(
      (board) => board.id === boardId,
    );

    if (!requestedBoardExists) {
      router.replace(getBoardRoute(activeBoard.id));
      return;
    }

    if (activeBoard.id !== boardId) {
      selectProject(boardId);
    }
  }, [activeBoard, boardId, isReady, router, selectProject, workspace]);

  useEffect(() => {
    const timers = toastTimersRef.current;

    return () => {
      for (const timerId of timers.values()) {
        window.clearTimeout(timerId);
      }

      timers.clear();
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNotesSnapshot(loadNotes());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useBoardKeyboardShortcuts({
    searchInputRef,
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenProjects: () => setIsProjectsOpen((current) => !current),
    onOpenQuickCreateCard: () => setIsQuickCreateOpen(true),
    onOpenQuickCreateList: () => setIsQuickCreateListOpen(true),
    onRedo: redo,
    onUndo: undo,
  });

  const isRequestedBoardReady =
    isReady && Boolean(workspace) && activeBoard?.id === boardId;

  if (!isRequestedBoardReady || !workspace || !activeBoard) {
    return <BoardLoadingState />;
  }

  const activeLists = getActiveBoardListIds(activeBoard).flatMap((listId) => {
    const list = activeBoard.lists[listId];
    return list ? [list] : [];
  });
  const requestedCard = selectedCardId
    ? activeBoard.cards[selectedCardId]
    : !isInitialCardDismissed && initialCardId
      ? activeBoard.cards[initialCardId]
      : undefined;
  const selectedCard =
    requestedCard &&
    !requestedCard.isArchived &&
    !activeBoard.lists[requestedCard.listId]?.isArchived
      ? requestedCard
      : undefined;
  const selectedListTitle = selectedCard
    ? (activeBoard.lists[selectedCard.listId]?.title ?? "Удалённый список")
    : "";
  const selectedCardComments = selectedCard
    ? selectedCard.commentIds.flatMap((commentId) => {
        const comment = activeBoard.comments[commentId];
        return comment ? [comment] : [];
      })
    : [];
  const selectedCardLinkedNotes = selectedCard
    ? getLinkedNotesForCard(notesSnapshot, activeBoard.id, selectedCard.id)
    : [];
  const resolvedAppearance = resolveBoardAppearance(activeBoard.appearance);
  const boardLabels = getOrderedBoardLabels(activeBoard);
  const activeCardsCount = Object.values(activeBoard.cards).filter(
    (card) => !card.isArchived && !activeBoard.lists[card.listId]?.isArchived,
  ).length;
  const visibleCardIdsByList = getVisibleCardIdsByList(
    activeBoard,
    cardFilters,
  );
  const visibleCardsCount = activeLists.reduce(
    (count, list) => count + (visibleCardIdsByList[list.id]?.length ?? 0),
    0,
  );
  const activeFiltersCount = getActiveCardFiltersCount(cardFilters);
  const workspaceHealthReport = evaluateWorkspaceHealth({
    notes: notesSnapshot,
    workspace,
  });
  const isFiltering = hasActiveCardFilters(cardFilters);
  const selectedListForActions = listActionsListId
    ? (activeBoard.lists[listActionsListId] ?? null)
    : null;
  const selectedFilterLabels = cardFilters.labelIds.flatMap((labelId) => {
    const label = activeBoard.labels[labelId];
    return label ? [label] : [];
  });
  const selectedFilterList =
    cardFilters.listId === "all" ? null : activeBoard.lists[cardFilters.listId];
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

  const closePanels = () => {
    setIsProjectsOpen(false);
    setIsBoardToolsOpen(false);
    setIsAppearanceOpen(false);
    setIsFiltersOpen(false);
  };

  const selectProjectFromHeader = (nextBoardId: string) => {
    selectProject(nextBoardId);
    setSelectedCardId(null);
    setIsInitialCardDismissed(true);
    setIsAppearanceOpen(false);
    setIsBoardToolsOpen(false);
    setIsArchiveOpen(false);
    setIsFiltersOpen(false);
    router.push(getBoardRoute(nextBoardId));

    setIsProjectsOpen(false);
  };

  const createProjectFromHeader = (title: string, templateId?: Parameters<typeof createProject>[1]) => {
    const createdBoardId = createProject(title, templateId);

    if (createdBoardId) {
      setSelectedCardId(null);
      setIsInitialCardDismissed(true);
      closePanels();
      setIsArchiveOpen(false);
      router.push(getBoardRoute(createdBoardId));
      showToast({
        title: "Проект создан",
        description: title,
        tone: "success",
      });
    }
  };

  const deleteProjectFromHeader = (deletedBoardId: string) => {
    const deletedBoardTitle =
      workspace.boards.find((board) => board.id === deletedBoardId)?.title ??
      "Проект";
    const nextActiveBoardId = deleteProject(deletedBoardId);
    setSelectedCardId(null);
    setIsInitialCardDismissed(true);
    setIsArchiveOpen(false);
    setIsFiltersOpen(false);

    if (deletedBoardId === boardId && nextActiveBoardId) {
      router.replace(getBoardRoute(nextActiveBoardId));
    }

    showToast({
      title: "Проект удалён",
      description: deletedBoardTitle,
      tone: "warning",
    });
  };

  const openCalendar = () => {
    closePanels();
    router.push(CALENDAR_ROUTE);
  };

  const openAnalytics = () => {
    closePanels();
    router.push(ANALYTICS_ROUTE);
  };

  const openNotes = () => {
    closePanels();
    router.push(NOTES_ROUTE);
  };

  const openMyWork = () => {
    closePanels();
    router.push(MY_WORK_ROUTE);
  };

  const openWorkspaceHealth = () => {
    setNotesSnapshot(loadNotes());
    closePanels();
    setIsArchiveOpen(false);
    setIsWorkspaceDataOpen(false);
    setIsWorkspaceCenterOpen(false);
    setIsWorkspaceHealthOpen(true);
  };

  const openWorkspaceCenter = () => {
    setNotesSnapshot(loadNotes());
    closePanels();
    setIsArchiveOpen(false);
    setIsWorkspaceDataOpen(false);
    setIsWorkspaceHealthOpen(false);
    setIsWorkspaceCenterOpen(true);
  };

  const openLinkedNote = (noteId: string) => {
    setIsInitialCardDismissed(true);
    setSelectedCardId(null);
    closePanels();
    router.push(`${NOTES_ROUTE}?note=${encodeURIComponent(noteId)}`);
  };

  const openCard = (cardId: string) => {
    setIsInitialCardDismissed(true);
    closePanels();
    setSelectedCardId(cardId);
  };

  const commandActions = getBoardCommandActions({
    board: activeBoard,
    activeListsCount: activeLists.length,
    onOpenArchive: () => setIsArchiveOpen(true),
    onOpenAnalytics: openAnalytics,
    onOpenAppearance: () => setIsAppearanceOpen(true),
    onOpenCalendar: openCalendar,
    onOpenMyWork: openMyWork,
    onOpenNotes: openNotes,
    onOpenFilters: () => setIsFiltersOpen(true),
    onOpenHealthCheck: openWorkspaceHealth,
    onOpenProjects: () => setIsProjectsOpen(true),
    onOpenWorkspaceCenter: openWorkspaceCenter,
    onOpenCard: openCard,
    onOpenQuickCreateCard: () => setIsQuickCreateOpen(true),
    onOpenQuickCreateList: () => setIsQuickCreateListOpen(true),
  });

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeFiltersCount={activeFiltersCount}
        activeView="board"
        canRedo={canRedo}
        canUndo={canUndo}
        healthCheckIssuesCount={workspaceHealthReport.issues.length}
        isAppearanceOpen={isAppearanceOpen}
        isArchiveOpen={isArchiveOpen}
        isFiltersOpen={isFiltersOpen}
        isHealthCheckOpen={isWorkspaceHealthOpen}
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        isBoardToolsOpen={isBoardToolsOpen}
        persistenceLabel={statusLabel}
        showProjectsButton={false}
        onOpenAnalytics={openAnalytics}
        onOpenBoard={() => router.push(getBoardRoute(activeBoard.id))}
        onOpenCalendar={openCalendar}
        onOpenMyWork={openMyWork}
        onOpenNotes={openNotes}
        onOpenCommands={() => setIsCommandPaletteOpen(true)}
        onOpenHealthCheck={openWorkspaceHealth}
        onOpenWorkspaceCenter={openWorkspaceCenter}
        onOpenWorkspaceData={() => setIsWorkspaceDataOpen(true)}
        onRedo={redo}
        onToggleBoardTools={() => {
          setIsBoardToolsOpen((current) => !current);
          setIsProjectsOpen(false);
          setIsAppearanceOpen(false);
          setIsArchiveOpen(false);
          setIsFiltersOpen(false);
        }}
        onToggleAppearance={() => {
          setIsAppearanceOpen((current) => !current);
          setIsProjectsOpen(false);
          setIsBoardToolsOpen(false);
          setIsArchiveOpen(false);
          setIsFiltersOpen(false);
        }}
        onToggleArchive={() => {
          setIsArchiveOpen((current) => !current);
          closePanels();
        }}
        onToggleFilters={() => {
          setIsFiltersOpen((current) => !current);
          setIsProjectsOpen(false);
          setIsBoardToolsOpen(false);
          setIsAppearanceOpen(false);
          setIsArchiveOpen(false);
        }}
        onToggleProjects={() => {
          setIsProjectsOpen((current) => !current);
          setIsBoardToolsOpen(false);
          setIsAppearanceOpen(false);
          setIsArchiveOpen(false);
          setIsFiltersOpen(false);
        }}
        onUndo={undo}
      >
        <ProjectSwitcher
          activeBoard={activeBoard}
          boards={workspace.boards}
          isOpen={isProjectsOpen}
          onCreateBoard={createProjectFromHeader}
          onDeleteBoard={deleteProjectFromHeader}
          onOpenChange={setIsProjectsOpen}
          onRenameActiveBoard={(title) =>
            updateActiveBoard((board) => renameBoard(board, title), "immediate")
          }
          onSelectBoard={selectProjectFromHeader}
        />
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isBoardToolsOpen ||
        isAppearanceOpen ||
        isFiltersOpen ? (
          <button
            aria-label="Закрыть боковую панель"
            className="absolute inset-0 z-30 bg-black/55 lg:hidden"
            type="button"
            onClick={closePanels}
          />
        ) : null}

        {isBoardToolsOpen ? (
          <BoardToolsSidebar
            board={activeBoard}
            isOpen={isBoardToolsOpen}
          onClose={() => setIsBoardToolsOpen(false)}
          onCreatePriorityOption={(name, color) =>
            updateActiveBoard(
              (board) => createCardPriorityOption(board, name, color),
              "immediate",
            )
          }
          onCreateStatusOption={(name, color) =>
            updateActiveBoard(
              (board) => createCardStatusOption(board, name, color),
              "immediate",
            )
          }
          onCreateChecklistTemplate={(title) =>
            updateActiveBoard(
              (board) => createChecklistTemplate(board, title),
              "immediate",
            )
          }
          onCreateCustomFieldTemplate={(name) =>
            updateActiveBoard(
              (board) => createCustomFieldTemplate(board, name),
              "immediate",
            )
          }
          onCreateLabel={(draft) => {
            let createdLabel: BoardLabel | null = null;
            updateActiveBoard((board) => {
              const result = createBoardLabel(board, draft);
              createdLabel = result.label;
              return result.board;
            }, "immediate");
            return createdLabel;
          }}
          onCreateMember={(draft) => {
            let createdMember: BoardMember | null = null;
            updateActiveBoard((board) => {
              const result = createBoardMember(board, draft);
              createdMember = result.member;
              return result.board;
            }, "immediate");
            return createdMember;
          }}
          onDeleteChecklistTemplate={(templateId) =>
            updateActiveBoard(
              (board) => deleteChecklistTemplate(board, templateId),
              "immediate",
            )
          }
          onDeletePriorityOption={(optionId) =>
            updateActiveBoard(
              (board) => deleteCardPriorityOption(board, optionId),
              "immediate",
            )
          }
          onDeleteStatusOption={(optionId) =>
            updateActiveBoard(
              (board) => deleteCardStatusOption(board, optionId),
              "immediate",
            )
          }
          onDeleteCustomFieldTemplate={(templateId) =>
            updateActiveBoard(
              (board) => deleteCustomFieldTemplate(board, templateId),
              "immediate",
            )
          }
          onDeleteLabel={(labelId) =>
            updateActiveBoard(
              (board) => deleteBoardLabel(board, labelId),
              "immediate",
            )
          }
          onDeleteMember={(memberId) =>
            updateActiveBoard(
              (board) => deleteBoardMember(board, memberId),
              "immediate",
            )
          }
          onUpdateChecklistTemplate={(templateId, title) =>
            updateActiveBoard(
              (board) => updateChecklistTemplate(board, templateId, title),
              "immediate",
            )
          }
          onUpdateCoverColors={(colors) =>
            updateActiveBoard(
              (board) => updateBoardCoverColors(board, colors),
              "immediate",
            )
          }
          onUpdateCustomFieldTemplate={(templateId, name) =>
            updateActiveBoard(
              (board) => updateCustomFieldTemplate(board, templateId, name),
              "immediate",
            )
          }
          onUpdateLabel={(labelId, draft) =>
            updateActiveBoard(
              (board) => updateBoardLabel(board, labelId, draft),
              "immediate",
            )
          }
          onUpdateMember={(memberId, draft) =>
            updateActiveBoard(
              (board) => updateBoardMember(board, memberId, draft),
              "immediate",
            )
          }
          onUpdatePriorityOption={(optionId, name, color) =>
            updateActiveBoard(
              (board) => updateCardPriorityOption(board, optionId, name, color),
              "immediate",
            )
          }
          onUpdateStatusOption={(optionId, name, color) =>
            updateActiveBoard(
              (board) => updateCardStatusOption(board, optionId, name, color),
              "immediate",
            )
          }
          onUpdatePriorityLabel={(priority, label) =>
            updateActiveBoard(
              (board) => updateCardPriorityLabel(board, priority, label),
              "immediate",
            )
          }
            onUpdateStatusLabel={(status, label) =>
              updateActiveBoard(
                (board) => updateCardStatusLabel(board, status, label),
                "immediate",
              )
            }
          />
        ) : null}

        <section className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden">
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

          <section
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{
              backgroundColor: resolvedAppearance.backgroundColor,
              backgroundImage: resolvedAppearance.backgroundImage,
              color: resolvedAppearance.canvasTextColor,
            }}
          >
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
              <div>
                <h1 className="text-base font-semibold">Рабочая доска</h1>
                <p
                  className="mt-1 text-sm"
                  style={{ color: resolvedAppearance.canvasMutedTextColor }}
                >
                  Перетаскивайте карточки и списки за значок с точками.
                </p>
              </div>

              <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:min-w-[min(100%,17rem)] sm:flex-1 sm:justify-end sm:max-w-xl">
                <label className="relative min-w-0 flex-1 sm:max-w-sm">
                  <span className="sr-only">Поиск карточек</span>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    size={17}
                    style={{ color: resolvedAppearance.canvasMutedTextColor }}
                  />
                  <TextField
                    ref={searchInputRef}
                    className="border-white/15 bg-slate-950/30 py-2 pl-10 pr-11 text-white placeholder:text-white/55 backdrop-blur-sm"
                    placeholder="Поиск задач…  /"
                    value={cardFilters.query}
                    onChange={(event) =>
                      setCardFilters((current) => ({
                        ...current,
                        query: event.target.value,
                      }))
                    }
                  />
                  {cardFilters.query ? (
                    <IconButton
                      className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-white/70 hover:bg-white/10 hover:text-white"
                      label="Очистить поиск"
                      size="sm"
                      onClick={() =>
                        setCardFilters((current) => ({ ...current, query: "" }))
                      }
                    >
                      <X aria-hidden="true" size={16} />
                    </IconButton>
                  ) : null}
                </label>
                <span
                  className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.35)",
                    color: resolvedAppearance.canvasTextColor,
                  }}
                >
                  {isFiltering
                    ? `${visibleCardsCount} из ${activeCardsCount}`
                    : `${activeCardsCount} задач`}
                </span>
              </div>
            </div>

            {isFiltering ? (
              <div className="px-4 pb-3 sm:px-6">
                <div className="rounded-xl border border-white/15 bg-slate-950/25 p-2.5 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    {cardFilters.query.trim() ? (
                      <ActiveFilterChip
                        label={`Поиск: ${cardFilters.query.trim()}`}
                        onClear={() =>
                          setCardFilters((current) => ({
                            ...current,
                            query: "",
                          }))
                        }
                      />
                    ) : null}

                    {selectedFilterLabels.map((label) => (
                      <ActiveFilterChip
                        key={label.id}
                        label={`Метка: ${label.name}`}
                        onClear={() =>
                          setCardFilters((current) => ({
                            ...current,
                            labelIds: current.labelIds.filter(
                              (labelId) => labelId !== label.id,
                            ),
                          }))
                        }
                      />
                    ))}

                    {cardFilters.status !== DEFAULT_CARD_FILTERS.status ? (
                      <ActiveFilterChip
                        label={`Статус: ${getOptionLabel(CARD_STATUS_FILTER_OPTIONS, cardFilters.status)}`}
                        onClear={() =>
                          setCardFilters((current) => ({
                            ...current,
                            status: DEFAULT_CARD_FILTERS.status,
                          }))
                        }
                      />
                    ) : null}

                    {cardFilters.priority !== DEFAULT_CARD_FILTERS.priority ? (
                      <ActiveFilterChip
                        label={`Приоритет: ${getOptionLabel(CARD_PRIORITY_FILTER_OPTIONS, cardFilters.priority)}`}
                        onClear={() =>
                          setCardFilters((current) => ({
                            ...current,
                            priority: DEFAULT_CARD_FILTERS.priority,
                          }))
                        }
                      />
                    ) : null}

                    {cardFilters.dueDate !== DEFAULT_CARD_FILTERS.dueDate ? (
                      <ActiveFilterChip
                        label={`Срок: ${getOptionLabel(CARD_DUE_FILTER_OPTIONS, cardFilters.dueDate)}`}
                        onClear={() =>
                          setCardFilters((current) => ({
                            ...current,
                            dueDate: DEFAULT_CARD_FILTERS.dueDate,
                          }))
                        }
                      />
                    ) : null}

                    {selectedFilterList ? (
                      <ActiveFilterChip
                        label={`Список: ${selectedFilterList.title}`}
                        onClear={() =>
                          setCardFilters((current) => ({
                            ...current,
                            listId: DEFAULT_CARD_FILTERS.listId,
                          }))
                        }
                      />
                    ) : null}

                    <button
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      type="button"
                      onClick={() =>
                        setCardFilters({ ...DEFAULT_CARD_FILTERS })
                      }
                    >
                      <X aria-hidden="true" size={14} />
                      Сбросить всё
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/65">
                    Перенос карточек и списков временно выключен, пока активны
                    фильтры.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="min-h-0 flex-1">
              <BoardColumns
                appearance={resolvedAppearance}
                board={activeBoard}
                isFiltering={isFiltering}
                visibleCardIdsByList={visibleCardIdsByList}
                onAddCard={(listId, title) => {
                  updateActiveBoard((board) => addCard(board, listId, title));
                  showToast({
                    title: "Карточка создана",
                    description:
                      activeBoard.lists[listId]?.title ?? "Новая карточка",
                    tone: "success",
                  });
                }}
                onAddList={(title) => {
                  updateActiveBoard((board) => addList(board, title));
                  showToast({
                    title: "Список создан",
                    description: title,
                    tone: "success",
                  });
                }}
                onDeleteList={(listId) => {
                  const deletedListTitle =
                    activeBoard.lists[listId]?.title ?? "Список";
                  if (cardFilters.listId === listId) {
                    setCardFilters((current) => ({
                      ...current,
                      listId: "all",
                    }));
                  }
                  updateActiveBoard(
                    (board) => deleteList(board, listId),
                    "immediate",
                  );
                  showToast({
                    title: "Список удалён",
                    description: deletedListTitle,
                    tone: "warning",
                  });
                }}
                onArchiveCard={(cardId) => {
                  const archivedCardTitle =
                    activeBoard.cards[cardId]?.title ?? "Карточка";
                  updateActiveBoard(
                    (board) => archiveCard(board, cardId),
                    "immediate",
                  );
                  showToast({
                    title: "Карточка архивирована",
                    description: archivedCardTitle,
                    tone: "info",
                  });
                }}
                onDeleteCard={(cardId) => {
                  const deletedCardTitle =
                    activeBoard.cards[cardId]?.title ?? "Карточка";
                  updateActiveBoard(
                    (board) => deleteCard(board, cardId),
                    "immediate",
                  );
                  showToast({
                    title: "Карточка удалена",
                    description: deletedCardTitle,
                    tone: "warning",
                  });
                }}
                onDuplicateCard={(cardId) => {
                  const duplicatedCardTitle =
                    activeBoard.cards[cardId]?.title ?? "Карточка";
                  updateActiveBoard(
                    (board) => duplicateCard(board, cardId),
                    "immediate",
                  );
                  showToast({
                    title: "Карточка дублирована",
                    description: duplicatedCardTitle,
                    tone: "success",
                  });
                }}
                onCreateChecklist={(cardId, title) =>
                  updateActiveBoard(
                    (board) => createChecklist(board, cardId, title),
                    "immediate",
                  )
                }
                onMoveCard={(cardId, listId, index) =>
                  updateActiveBoard((board) =>
                    moveCard(board, cardId, listId, index),
                  )
                }
                onMoveList={(listId, destinationListId) =>
                  updateActiveBoard((board) =>
                    moveList(board, listId, destinationListId),
                  )
                }
                onOpenCard={openCard}
                onOpenListActions={setListActionsListId}
                onRenameList={(listId, title) =>
                  updateActiveBoard((board) => renameList(board, listId, title))
                }
                onSaveCard={(cardId, draft) =>
                  updateActiveBoard(
                    (board) => updateCard(board, cardId, draft),
                    "immediate",
                  )
                }
              />
            </div>
          </section>
        </section>

        {isAppearanceOpen ? (
          <BoardAppearanceSidebar
            board={activeBoard}
            isOpen={isAppearanceOpen}
            onChange={(appearance) =>
              updateActiveBoard((board) =>
                updateBoardAppearance(board, appearance),
              )
            }
            onClose={() => setIsAppearanceOpen(false)}
          />
        ) : null}

        {isFiltersOpen ? (
          <CardFiltersSidebar
            filters={cardFilters}
            isOpen={isFiltersOpen}
            labels={boardLabels}
            lists={activeLists}
            onChange={setCardFilters}
            onClose={() => setIsFiltersOpen(false)}
          />
        ) : null}
      </div>

      {isArchiveOpen ? (
        <CardArchiveModal
          cards={Object.values(activeBoard.cards)}
          checklistItems={activeBoard.checklistItems}
          checklists={activeBoard.checklists}
          labels={activeBoard.labels}
          lists={activeBoard.lists}
          onClose={() => setIsArchiveOpen(false)}
          onDelete={(cardId) => {
            const deletedCardTitle =
              activeBoard.cards[cardId]?.title ?? "Карточка";
            updateActiveBoard(
              (board) => deleteCard(board, cardId),
              "immediate",
            );
            showToast({
              title: "Карточка удалена",
              description: deletedCardTitle,
              tone: "warning",
            });
          }}
          onRestore={(cardId) => {
            const restoredCardTitle =
              activeBoard.cards[cardId]?.title ?? "Карточка";
            updateActiveBoard(
              (board) => restoreCard(board, cardId),
              "immediate",
            );
            showToast({
              title: "Карточка восстановлена",
              description: restoredCardTitle,
              tone: "success",
            });
          }}
          onRestoreList={(listId) => {
            const restoredListTitle =
              activeBoard.lists[listId]?.title ?? "Список";
            updateActiveBoard(
              (board) => restoreList(board, listId),
              "immediate",
            );
            showToast({
              title: "Список восстановлен",
              description: restoredListTitle,
              tone: "success",
            });
          }}
        />
      ) : null}

      <ListActionsDialog
        availableLists={activeLists}
        list={selectedListForActions}
        onArchive={(listId) => {
          const archivedListTitle =
            activeBoard.lists[listId]?.title ?? "Список";
          if (cardFilters.listId === listId) {
            setCardFilters((current) => ({ ...current, listId: "all" }));
          }
          updateActiveBoard((board) => archiveList(board, listId), "immediate");
          showToast({
            title: "Список архивирован",
            description: archivedListTitle,
            tone: "info",
          });
        }}
        onClear={(listId) => {
          const clearedListTitle = activeBoard.lists[listId]?.title ?? "Список";
          updateActiveBoard((board) => clearList(board, listId), "immediate");
          showToast({
            title: "Список очищен",
            description: clearedListTitle,
            tone: "warning",
          });
        }}
        onClose={() => setListActionsListId(null)}
        onDuplicate={(listId) => {
          const duplicatedListTitle =
            activeBoard.lists[listId]?.title ?? "Список";
          updateActiveBoard(
            (board) => duplicateList(board, listId),
            "immediate",
          );
          showToast({
            title: "Список дублирован",
            description: duplicatedListTitle,
            tone: "success",
          });
        }}
        onMoveAll={(sourceListId, destinationListId) => {
          const sourceTitle =
            activeBoard.lists[sourceListId]?.title ?? "Список";
          const destinationTitle =
            activeBoard.lists[destinationListId]?.title ?? "другой список";
          updateActiveBoard(
            (board) => moveAllCards(board, sourceListId, destinationListId),
            "immediate",
          );
          showToast({
            title: "Карточки перенесены",
            description: `${sourceTitle} -> ${destinationTitle}`,
            tone: "success",
          });
        }}
        onSetWipLimit={(listId, limit) =>
          updateActiveBoard(
            (board) => setListWipLimit(board, listId, limit),
            "immediate",
          )
        }
      />

      {selectedCard ? (
        <CardModal
          key={selectedCard.id}
          attachments={getCardAttachments(activeBoard, selectedCard)}
          card={selectedCard}
          checklists={getCardChecklists(selectedCard, activeBoard.checklists)}
          checklistItems={activeBoard.checklistItems}
          comments={selectedCardComments}
          linkedNotes={selectedCardLinkedNotes}
          lists={activeLists}
          listTitle={selectedListTitle}
          onAddAttachment={(attachment) =>
            updateActiveBoard(
              (board) => addAttachmentToCard(board, attachment),
              "immediate",
            )
          }
          onArchive={(cardId) => {
            const archivedCardTitle =
              activeBoard.cards[cardId]?.title ?? "Карточка";
            updateActiveBoard(
              (board) => archiveCard(board, cardId),
              "immediate",
            );
            showToast({
              title: "Карточка архивирована",
              description: archivedCardTitle,
              tone: "info",
            });
          }}
          onClose={() => {
            setIsInitialCardDismissed(true);
            setSelectedCardId(null);
          }}
          onCreateComment={(cardId, message) =>
            updateActiveBoard(
              (board) => addCardComment(board, cardId, message),
              "immediate",
            )
          }
          onCreateChecklist={(cardId, title) =>
            updateActiveBoard(
              (board) => createChecklist(board, cardId, title),
              "immediate",
            )
          }
          onCreateChecklistItem={(checklistId, title) =>
            updateActiveBoard(
              (board) => createChecklistItem(board, checklistId, title),
              "immediate",
            )
          }
          onDelete={(cardId) => {
            const deletedCardTitle =
              activeBoard.cards[cardId]?.title ?? "Карточка";
            updateActiveBoard(
              (board) => deleteCard(board, cardId),
              "immediate",
            );
            showToast({
              title: "Карточка удалена",
              description: deletedCardTitle,
              tone: "warning",
            });
          }}
          onDeleteAttachment={(attachmentId) =>
            updateActiveBoard(
              (board) => removeAttachmentFromCard(board, attachmentId),
              "immediate",
            )
          }
          onDeleteChecklist={(checklistId) =>
            updateActiveBoard(
              (board) => deleteChecklist(board, checklistId),
              "immediate",
            )
          }
          onDeleteChecklistItem={(itemId) =>
            updateActiveBoard(
              (board) => deleteChecklistItem(board, itemId),
              "immediate",
            )
          }
          onDeleteComment={(commentId) =>
            updateActiveBoard(
              (board) => deleteCardComment(board, commentId),
              "immediate",
            )
          }
          onOpenLinkedNote={openLinkedNote}
          onDuplicate={(cardId) => {
            const duplicatedCardTitle =
              activeBoard.cards[cardId]?.title ?? "Карточка";
            updateActiveBoard(
              (board) => duplicateCard(board, cardId),
              "immediate",
            );
            showToast({
              title: "Карточка дублирована",
              description: duplicatedCardTitle,
              tone: "success",
            });
          }}
          onMove={(cardId, destinationListId) =>
            updateActiveBoard((board) => {
              const destinationList = board.lists[destinationListId];
              return destinationList
                ? moveCard(
                    board,
                    cardId,
                    destinationListId,
                    destinationList.cardIds.length,
                  )
                : board;
            }, "immediate")
          }
          onMoveChecklistItem={(itemId, destinationIndex) =>
            updateActiveBoard(
              (board) => moveChecklistItem(board, itemId, destinationIndex),
              "immediate",
            )
          }
          onRenameChecklist={(checklistId, title) =>
            updateActiveBoard(
              (board) => renameChecklist(board, checklistId, title),
              "immediate",
            )
          }
          onRenameChecklistItem={(itemId, title) =>
            updateActiveBoard(
              (board) => renameChecklistItem(board, itemId, title),
              "immediate",
            )
          }
          onSave={(cardId, draft: CardDraft) =>
            updateActiveBoard((board) => updateCard(board, cardId, draft))
          }
          onToggleChecklistItem={(itemId) =>
            updateActiveBoard(
              (board) => toggleChecklistItem(board, itemId),
              "immediate",
            )
          }
          onUpdateComment={(commentId, message) =>
            updateActiveBoard(
              (board) => updateCardComment(board, commentId, message),
              "immediate",
            )
          }
        />
      ) : null}

      {isQuickCreateOpen ? (
        <QuickCreateCardDialog
          isOpen={isQuickCreateOpen}
          lists={activeLists}
          onClose={() => setIsQuickCreateOpen(false)}
          onCreate={(listId, title) => {
            updateActiveBoard(
              (board) => addCard(board, listId, title),
              "immediate",
            );
            showToast({
              title: "Карточка создана",
              description: activeBoard.lists[listId]?.title ?? title,
              tone: "success",
            });
          }}
        />
      ) : null}

      {isQuickCreateListOpen ? (
        <QuickCreateListDialog
          isOpen={isQuickCreateListOpen}
          onClose={() => setIsQuickCreateListOpen(false)}
          onCreate={(title) => {
            updateActiveBoard((board) => addList(board, title), "immediate");
            showToast({
              title: "Список создан",
              description: title,
              tone: "success",
            });
          }}
        />
      ) : null}

      {isCommandPaletteOpen ? (
        <CommandPalette
          actions={commandActions}
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      ) : null}

      {isWorkspaceDataOpen ? (
        <WorkspaceDataModal
          activeBoard={activeBoard}
          isOpen={isWorkspaceDataOpen}
          isWorkspaceStorageBusy={isWorkspaceStorageBusy}
          workspace={workspace}
          workspaceStorage={workspaceStorage}
          onClose={() => setIsWorkspaceDataOpen(false)}
          onConnectFolder={connectWorkspaceFolder}
          onCreateFolderBackup={createFolderBackup}
          onDisconnectFolder={disconnectWorkspaceFolder}
          onImport={({ workspace: nextWorkspace, notes }) => {
            replaceStoredNotes(notes);
            if (notes) {
              setNotesSnapshot([...notes]);
            }
            replaceWorkspace(nextWorkspace);
            const nextBoardId =
              nextWorkspace.activeBoardId ?? nextWorkspace.boards[0]?.id;
            if (nextBoardId) {
              router.replace(getBoardRoute(nextBoardId));
            }
            showToast({
              title: "Workspace импортирован",
              description: `${nextWorkspace.boards.length} проектов`,
              tone: "success",
            });
          }}
        />
      ) : null}

      {isWorkspaceCenterOpen ? (
        <WorkspaceCenterModal
          activeBoard={activeBoard}
          healthReport={workspaceHealthReport}
          isOpen={isWorkspaceCenterOpen}
          notes={notesSnapshot}
          onApplyWorkflowTemplate={workspaceCenterActions.applyWorkflowTemplate}
          onClose={() => setIsWorkspaceCenterOpen(false)}
          onCreateNoteTemplate={workspaceCenterActions.createNoteTemplate}
          onOpenHealthCheck={openWorkspaceHealth}
          onOpenWorkspaceData={() => {
            setIsWorkspaceCenterOpen(false);
            setIsWorkspaceDataOpen(true);
          }}
        />
      ) : null}

      {isWorkspaceHealthOpen ? (
        <WorkspaceHealthModal
          isOpen={isWorkspaceHealthOpen}
          report={workspaceHealthReport}
          onClose={() => setIsWorkspaceHealthOpen(false)}
        />
      ) : null}

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
