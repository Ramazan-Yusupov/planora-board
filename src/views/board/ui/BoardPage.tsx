"use client";

import { AlertTriangle, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  DEFAULT_CARD_FILTERS,
  getActiveCardFiltersCount,
  getVisibleCardIdsByList,
  hasActiveCardFilters,
  type CardFilters,
} from "@/features/filter-cards";
import { useBoardWorkspace } from "@/features/manage-board-workspace";
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
  NOTES_ROUTE,
  getBoardRoute,
} from "@/shared/config/routes";
import { IconButton, TextField } from "@/shared/ui";
import { BoardAppearanceSidebar } from "@/widgets/board-appearance";
import { BoardColumns } from "@/widgets/board-columns";
import { BoardToolsSidebar } from "@/widgets/board-tools";
import { CardArchiveModal } from "@/widgets/card-archive";
import { CardFiltersSidebar } from "@/widgets/card-filters";
import { CardModal } from "@/widgets/card-modal";
import {
  CommandPalette,
  QuickCreateCardDialog,
  QuickCreateListDialog,
} from "@/widgets/command-palette";
import { ListActionsDialog } from "@/widgets/list-actions";
import { ProjectSidebar } from "@/widgets/project-sidebar";
import { WorkspaceDataModal } from "@/widgets/workspace-data";
import { WorkspaceHeader } from "@/widgets/workspace-header";

import { getBoardCommandActions } from "../lib/getBoardCommandActions";
import { useBoardKeyboardShortcuts } from "../lib/useBoardKeyboardShortcuts";
import { BoardLoadingState } from "./BoardLoadingState";
import { BoardTitleInput } from "./BoardTitleInput";

type BoardPageProps = Readonly<{
  boardId: string;
  initialCardId?: string;
}>;

function isMobileViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 1023px)").matches
  );
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
  const [listActionsListId, setListActionsListId] = useState<string | null>(
    null,
  );
  const [cardFilters, setCardFilters] = useState<CardFilters>({
    ...DEFAULT_CARD_FILTERS,
  });
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
  const isFiltering = hasActiveCardFilters(cardFilters);
  const selectedListForActions = listActionsListId
    ? (activeBoard.lists[listActionsListId] ?? null)
    : null;
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

  const closePanels = () => {
    setIsProjectsOpen(false);
    setIsBoardToolsOpen(false);
    setIsAppearanceOpen(false);
    setIsFiltersOpen(false);
  };

  const selectProjectFromSidebar = (nextBoardId: string) => {
    selectProject(nextBoardId);
    setSelectedCardId(null);
    setIsInitialCardDismissed(true);
    setIsAppearanceOpen(false);
    setIsBoardToolsOpen(false);
    setIsArchiveOpen(false);
    setIsFiltersOpen(false);
    router.push(getBoardRoute(nextBoardId));

    if (isMobileViewport()) {
      setIsProjectsOpen(false);
    }
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

  const commandActions = getBoardCommandActions({
    activeListsCount: activeLists.length,
    onOpenArchive: () => setIsArchiveOpen(true),
    onOpenAnalytics: openAnalytics,
    onOpenAppearance: () => setIsAppearanceOpen(true),
    onOpenCalendar: openCalendar,
    onOpenNotes: openNotes,
    onOpenFilters: () => setIsFiltersOpen(true),
    onOpenProjects: () => setIsProjectsOpen(true),
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
        isAppearanceOpen={isAppearanceOpen}
        isArchiveOpen={isArchiveOpen}
        isFiltersOpen={isFiltersOpen}
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        isBoardToolsOpen={isBoardToolsOpen}
        persistenceLabel={statusLabel}
        onOpenAnalytics={openAnalytics}
        onOpenBoard={() => router.push(getBoardRoute(activeBoard.id))}
        onOpenCalendar={openCalendar}
        onOpenNotes={openNotes}
        onOpenCommands={() => setIsCommandPaletteOpen(true)}
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
        <label className="sr-only" htmlFor="board-title">
          Название проекта
        </label>
        <BoardTitleInput
          key={activeBoard.id}
          disabled={!isReady}
          title={activeBoard.title}
          onCommit={(title) =>
            updateActiveBoard((board) => renameBoard(board, title), "immediate")
          }
        />
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isProjectsOpen || isBoardToolsOpen || isAppearanceOpen || isFiltersOpen ? (
          <button
            aria-label="Закрыть боковую панель"
            className="absolute inset-0 z-30 bg-black/55 lg:hidden"
            type="button"
            onClick={closePanels}
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
              setSelectedCardId(null);
              setIsInitialCardDismissed(true);
              closePanels();
              setIsArchiveOpen(false);
              router.push(getBoardRoute(createdBoardId));
            }
          }}
          onDeleteBoard={(deletedBoardId) => {
            const nextActiveBoardId = deleteProject(deletedBoardId);
            setSelectedCardId(null);
            setIsInitialCardDismissed(true);
            setIsArchiveOpen(false);
            setIsFiltersOpen(false);
            if (deletedBoardId === boardId && nextActiveBoardId) {
              router.replace(getBoardRoute(nextActiveBoardId));
            }
          }}
          onSelectBoard={selectProjectFromSidebar}
        />

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
                <p className="rounded-xl border border-white/15 bg-slate-950/25 px-3 py-2 text-xs leading-5 text-white/75 backdrop-blur-sm">
                  Во время поиска и фильтрации перенос карточек и списков
                  временно выключен. Очистите фильтры, чтобы изменить порядок.
                </p>
              </div>
            ) : null}

            <div className="min-h-0 flex-1">
              <BoardColumns
                appearance={resolvedAppearance}
                board={activeBoard}
                isFiltering={isFiltering}
                visibleCardIdsByList={visibleCardIdsByList}
                onAddCard={(listId, title) =>
                  updateActiveBoard((board) => addCard(board, listId, title))
                }
                onAddList={(title) =>
                  updateActiveBoard((board) => addList(board, title))
                }
                onDeleteList={(listId) => {
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
                }}
                onArchiveCard={(cardId) =>
                  updateActiveBoard(
                    (board) => archiveCard(board, cardId),
                    "immediate",
                  )
                }
                onDeleteCard={(cardId) =>
                  updateActiveBoard(
                    (board) => deleteCard(board, cardId),
                    "immediate",
                  )
                }
                onDuplicateCard={(cardId) =>
                  updateActiveBoard(
                    (board) => duplicateCard(board, cardId),
                    "immediate",
                  )
                }
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
                onOpenCard={(cardId) => {
                  setIsInitialCardDismissed(true);
                  setIsFiltersOpen(false);
                  setSelectedCardId(cardId);
                }}
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

        <CardFiltersSidebar
          filters={cardFilters}
          isOpen={isFiltersOpen}
          labels={boardLabels}
          lists={activeLists}
          onChange={setCardFilters}
          onClose={() => setIsFiltersOpen(false)}
        />
      </div>

      {isArchiveOpen ? (
        <CardArchiveModal
          cards={Object.values(activeBoard.cards)}
          checklistItems={activeBoard.checklistItems}
          checklists={activeBoard.checklists}
          labels={activeBoard.labels}
          lists={activeBoard.lists}
          onClose={() => setIsArchiveOpen(false)}
          onDelete={(cardId) =>
            updateActiveBoard((board) => deleteCard(board, cardId), "immediate")
          }
          onRestore={(cardId) =>
            updateActiveBoard(
              (board) => restoreCard(board, cardId),
              "immediate",
            )
          }
          onRestoreList={(listId) =>
            updateActiveBoard(
              (board) => restoreList(board, listId),
              "immediate",
            )
          }
        />
      ) : null}

      <ListActionsDialog
        availableLists={activeLists}
        list={selectedListForActions}
        onArchive={(listId) => {
          if (cardFilters.listId === listId) {
            setCardFilters((current) => ({ ...current, listId: "all" }));
          }
          updateActiveBoard((board) => archiveList(board, listId), "immediate");
        }}
        onClear={(listId) =>
          updateActiveBoard((board) => clearList(board, listId), "immediate")
        }
        onClose={() => setListActionsListId(null)}
        onDuplicate={(listId) =>
          updateActiveBoard(
            (board) => duplicateList(board, listId),
            "immediate",
          )
        }
        onMoveAll={(sourceListId, destinationListId) =>
          updateActiveBoard(
            (board) => moveAllCards(board, sourceListId, destinationListId),
            "immediate",
          )
        }
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
          lists={activeLists}
          listTitle={selectedListTitle}
          onAddAttachment={(attachment) =>
            updateActiveBoard(
              (board) => addAttachmentToCard(board, attachment),
              "immediate",
            )
          }
          onArchive={(cardId) =>
            updateActiveBoard(
              (board) => archiveCard(board, cardId),
              "immediate",
            )
          }
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
          onDelete={(cardId) =>
            updateActiveBoard((board) => deleteCard(board, cardId), "immediate")
          }
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
          onDuplicate={(cardId) =>
            updateActiveBoard(
              (board) => duplicateCard(board, cardId),
              "immediate",
            )
          }
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

      <QuickCreateCardDialog
        isOpen={isQuickCreateOpen}
        lists={activeLists}
        onClose={() => setIsQuickCreateOpen(false)}
        onCreate={(listId, title) =>
          updateActiveBoard(
            (board) => addCard(board, listId, title),
            "immediate",
          )
        }
      />

      <QuickCreateListDialog
        isOpen={isQuickCreateListOpen}
        onClose={() => setIsQuickCreateListOpen(false)}
        onCreate={(title) =>
          updateActiveBoard((board) => addList(board, title), "immediate")
        }
      />

      <CommandPalette
        actions={commandActions}
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

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
        onImport={(nextWorkspace) => {
          replaceWorkspace(nextWorkspace);
          const nextBoardId =
            nextWorkspace.activeBoardId ?? nextWorkspace.boards[0]?.id;
          if (nextBoardId) {
            router.replace(getBoardRoute(nextBoardId));
          }
        }}
      />
    </main>
  );
}
