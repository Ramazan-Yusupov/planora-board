"use client";

import {
  AlertTriangle,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getCardAttachments,
  getCardChecklists,
  getOrderedBoardLabels,
  resolveBoardAppearance,
  type BoardLabel,
  type BoardLabelDraft,
  type BoardMember,
  type BoardMemberDraft,
  type CardDraft,
} from "@/entities/board";
import { archiveCard, restoreCard } from "@/features/archive-card";
import {
  addCard,
  addCardComment,
  addList,
  archiveList,
  clearList,
  createBoardMember,
  deleteBoardMember,
  deleteCard,
  deleteCardComment,
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
  toggleCardMember,
  updateBoardAppearance,
  updateBoardMember,
  updateCard,
  updateCardComment,
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
  createBoardLabel,
  deleteBoardLabel,
  updateBoardLabel,
} from "@/features/manage-labels";
import { ADMIN_ROUTE, CALENDAR_ROUTE, getBoardRoute } from "@/shared/config/routes";
import { IconButton, TextField } from "@/shared/ui";
import { BoardAppearanceSidebar } from "@/widgets/board-appearance";
import { BoardColumns } from "@/widgets/board-columns";
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

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function BoardLoadingState() {
  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
      <p
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
      >
        Загружаем доску…
      </p>
    </main>
  );
}

type BoardTitleInputProps = Readonly<{
  title: string;
  disabled: boolean;
  onCommit: (title: string) => void;
}>;

function BoardTitleInput({ title, disabled, onCommit }: BoardTitleInputProps) {
  const [draft, setDraft] = useState(title);

  const commit = (value: string) => {
    const nextTitle = value.trim() || "Новый проект";
    setDraft(nextTitle);

    if (nextTitle !== title) {
      onCommit(nextTitle);
    }
  };

  return (
    <TextField
      id="board-title"
      className="h-auto border-transparent bg-transparent px-2 py-2 text-base font-semibold hover:border-white/10 focus:bg-control sm:px-3 sm:text-lg"
      disabled={disabled}
      value={draft}
      onBlur={(event) => commit(event.currentTarget.value)}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(title);
          event.currentTarget.blur();
        }
      }}
    />
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
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isQuickCreateListOpen, setIsQuickCreateListOpen] = useState(false);
  const [isWorkspaceDataOpen, setIsWorkspaceDataOpen] = useState(false);
  const [listActionsListId, setListActionsListId] = useState<string | null>(null);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEditingTarget(event.target)) {
        return;
      }

      const key = event.key.toLocaleLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (event.key === "/" && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (key === "b" && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setIsProjectsOpen((current) => !current);
        return;
      }

      if (key === "n" && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setIsQuickCreateOpen(true);
        return;
      }

      if (key === "l" && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setIsQuickCreateListOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

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
    ? activeBoard.lists[selectedCard.listId]?.title ?? "Удалённый список"
    : "";
  const selectedCardComments = selectedCard
    ? selectedCard.commentIds.flatMap((commentId) => {
        const comment = activeBoard.comments[commentId];
        return comment ? [comment] : [];
      })
    : [];
  const resolvedAppearance = resolveBoardAppearance(activeBoard.appearance);
  const boardLabels = getOrderedBoardLabels(activeBoard);
  const boardMembers = activeBoard.memberIds.flatMap((memberId) => {
    const member = activeBoard.members[memberId];
    return member ? [member] : [];
  });
  const activeCardsCount = Object.values(activeBoard.cards).filter(
    (card) => !card.isArchived && !activeBoard.lists[card.listId]?.isArchived,
  ).length;
  const visibleCardIdsByList = getVisibleCardIdsByList(activeBoard, cardFilters);
  const visibleCardsCount = activeLists.reduce(
    (count, list) => count + (visibleCardIdsByList[list.id]?.length ?? 0),
    0,
  );
  const activeFiltersCount = getActiveCardFiltersCount(cardFilters);
  const isFiltering = hasActiveCardFilters(cardFilters);
  const selectedListForActions = listActionsListId
    ? activeBoard.lists[listActionsListId] ?? null
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
    setIsAppearanceOpen(false);
    setIsFiltersOpen(false);
  };

  const selectProjectFromSidebar = (nextBoardId: string) => {
    selectProject(nextBoardId);
    setSelectedCardId(null);
    setIsInitialCardDismissed(true);
    setIsAppearanceOpen(false);
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

  const commandActions = getBoardCommandActions({
    activeListsCount: activeLists.length,
    onOpenArchive: () => setIsArchiveOpen(true),
    onOpenAdmin: () => router.push(ADMIN_ROUTE),
    onOpenAppearance: () => setIsAppearanceOpen(true),
    onOpenCalendar: openCalendar,
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
        persistenceLabel={statusLabel}
        onOpenBoard={() => router.push(getBoardRoute(activeBoard.id))}
        onOpenCalendar={openCalendar}
        onOpenCommands={() => setIsCommandPaletteOpen(true)}
        onOpenWorkspaceData={() => setIsWorkspaceDataOpen(true)}
        onRedo={redo}
        onToggleAppearance={() => {
          setIsAppearanceOpen((current) => !current);
          setIsProjectsOpen(false);
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
          setIsAppearanceOpen(false);
          setIsArchiveOpen(false);
        }}
        onToggleProjects={() => {
          setIsProjectsOpen((current) => !current);
          setIsAppearanceOpen(false);
          setIsArchiveOpen(false);
          setIsFiltersOpen(false);
        }}
        onUndo={undo}
      >
        <label className="sr-only" htmlFor="board-title">Название проекта</label>
        <BoardTitleInput
          key={activeBoard.id}
          disabled={!isReady}
          title={activeBoard.title}
          onCommit={(title) => updateActiveBoard((board) => renameBoard(board, title), "immediate")}
        />
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isProjectsOpen || isAppearanceOpen || isFiltersOpen ? (
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

        <section className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden">
          {storageError ? (
            <div className="border-b border-amber-300/35 bg-amber-950/70 px-4 py-3 text-amber-100 sm:px-6">
              <div className="mx-auto flex max-w-[1800px] items-start gap-2 text-sm leading-5">
                <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
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
                <p className="mt-1 text-sm" style={{ color: resolvedAppearance.canvasMutedTextColor }}>
                  Перетаскивайте карточки и списки за значок с точками.
                </p>
              </div>

              <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:min-w-[min(100%,17rem)] sm:flex-1 sm:justify-end sm:max-w-xl">
                <label className="relative min-w-0 flex-1 sm:max-w-sm">
                  <span className="sr-only">Поиск карточек</span>
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={17} style={{ color: resolvedAppearance.canvasMutedTextColor }} />
                  <TextField
                    ref={searchInputRef}
                    className="border-white/15 bg-slate-950/30 py-2 pl-10 pr-11 text-white placeholder:text-white/55 backdrop-blur-sm"
                    placeholder="Поиск задач…  /"
                    value={cardFilters.query}
                    onChange={(event) => setCardFilters((current) => ({ ...current, query: event.target.value }))}
                  />
                  {cardFilters.query ? (
                    <IconButton
                      className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-white/70 hover:bg-white/10 hover:text-white"
                      label="Очистить поиск"
                      size="sm"
                      onClick={() => setCardFilters((current) => ({ ...current, query: "" }))}
                    >
                      <X aria-hidden="true" size={16} />
                    </IconButton>
                  ) : null}
                </label>
                <span className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "rgba(15, 23, 42, 0.35)", color: resolvedAppearance.canvasTextColor }}>
                  {isFiltering ? `${visibleCardsCount} из ${activeCardsCount}` : `${activeCardsCount} задач`}
                </span>
              </div>
            </div>

            {isFiltering ? (
              <div className="px-4 pb-3 sm:px-6">
                <p className="rounded-xl border border-white/15 bg-slate-950/25 px-3 py-2 text-xs leading-5 text-white/75 backdrop-blur-sm">
                  Во время поиска и фильтрации перенос карточек и списков временно выключен. Очистите фильтры, чтобы изменить порядок.
                </p>
              </div>
            ) : null}

            <div className="min-h-0 flex-1">
              <BoardColumns
                appearance={resolvedAppearance}
                board={activeBoard}
                isFiltering={isFiltering}
                visibleCardIdsByList={visibleCardIdsByList}
                onAddCard={(listId, title) => updateActiveBoard((board) => addCard(board, listId, title))}
                onAddList={(title) => updateActiveBoard((board) => addList(board, title))}
                onDeleteList={(listId) => {
                  if (cardFilters.listId === listId) {
                    setCardFilters((current) => ({ ...current, listId: "all" }));
                  }
                  updateActiveBoard((board) => deleteList(board, listId), "immediate");
                }}
                onMoveCard={(cardId, listId, index) => updateActiveBoard((board) => moveCard(board, cardId, listId, index))}
                onMoveList={(listId, destinationListId) => updateActiveBoard((board) => moveList(board, listId, destinationListId))}
                onOpenCard={(cardId) => {
                  setIsInitialCardDismissed(true);
                  setIsFiltersOpen(false);
                  setSelectedCardId(cardId);
                }}
                onOpenListActions={setListActionsListId}
                onRenameList={(listId, title) => updateActiveBoard((board) => renameList(board, listId, title))}
              />
            </div>
          </section>
        </section>

        <BoardAppearanceSidebar
          board={activeBoard}
          isOpen={isAppearanceOpen}
          onChange={(appearance) => updateActiveBoard((board) => updateBoardAppearance(board, appearance))}
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
          onDelete={(cardId) => updateActiveBoard((board) => deleteCard(board, cardId), "immediate")}
          onRestore={(cardId) => updateActiveBoard((board) => restoreCard(board, cardId), "immediate")}
          onRestoreList={(listId) => updateActiveBoard((board) => restoreList(board, listId), "immediate")}
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
        onClear={(listId) => updateActiveBoard((board) => clearList(board, listId), "immediate")}
        onClose={() => setListActionsListId(null)}
        onDuplicate={(listId) => updateActiveBoard((board) => duplicateList(board, listId), "immediate")}
        onMoveAll={(sourceListId, destinationListId) => updateActiveBoard((board) => moveAllCards(board, sourceListId, destinationListId), "immediate")}
        onSetWipLimit={(listId, limit) => updateActiveBoard((board) => setListWipLimit(board, listId, limit), "immediate")}
      />

      {selectedCard ? (
        <CardModal
          key={selectedCard.id}
          attachments={getCardAttachments(activeBoard, selectedCard)}
          card={selectedCard}
          checklists={getCardChecklists(selectedCard, activeBoard.checklists)}
          checklistItems={activeBoard.checklistItems}
          comments={selectedCardComments}
          labels={boardLabels}
          lists={activeLists}
          listTitle={selectedListTitle}
          members={boardMembers}
          onAddAttachment={(attachment) => updateActiveBoard((board) => addAttachmentToCard(board, attachment), "immediate")}
          onArchive={(cardId) => updateActiveBoard((board) => archiveCard(board, cardId), "immediate")}
          onClose={() => {
            setIsInitialCardDismissed(true);
            setSelectedCardId(null);
          }}
          onCreateComment={(cardId, message) => updateActiveBoard((board) => addCardComment(board, cardId, message), "immediate")}
          onCreateChecklist={(cardId, title) => updateActiveBoard((board) => createChecklist(board, cardId, title), "immediate")}
          onCreateChecklistItem={(checklistId, title) => updateActiveBoard((board) => createChecklistItem(board, checklistId, title), "immediate")}
          onCreateLabel={(draft: BoardLabelDraft): BoardLabel | null => {
            let createdLabel: BoardLabel | null = null;
            updateActiveBoard((board) => {
              const result = createBoardLabel(board, draft);
              createdLabel = result.label;
              return result.board;
            }, "immediate");
            return createdLabel;
          }}
          onCreateMember={(draft: BoardMemberDraft): BoardMember | null => {
            let createdMember: BoardMember | null = null;
            updateActiveBoard((board) => {
              const result = createBoardMember(board, draft);
              createdMember = result.member;
              return result.board;
            }, "immediate");
            return createdMember;
          }}
          onDelete={(cardId) => updateActiveBoard((board) => deleteCard(board, cardId), "immediate")}
          onDeleteAttachment={(attachmentId) => updateActiveBoard((board) => removeAttachmentFromCard(board, attachmentId), "immediate")}
          onDeleteChecklist={(checklistId) => updateActiveBoard((board) => deleteChecklist(board, checklistId), "immediate")}
          onDeleteChecklistItem={(itemId) => updateActiveBoard((board) => deleteChecklistItem(board, itemId), "immediate")}
          onDeleteComment={(commentId) => updateActiveBoard((board) => deleteCardComment(board, commentId), "immediate")}
          onDeleteLabel={(labelId) => {
            setCardFilters((current) => ({ ...current, labelIds: current.labelIds.filter((currentLabelId) => currentLabelId !== labelId) }));
            updateActiveBoard((board) => deleteBoardLabel(board, labelId), "immediate");
          }}
          onDeleteMember={(memberId) => updateActiveBoard((board) => deleteBoardMember(board, memberId), "immediate")}
          onDuplicate={(cardId) => updateActiveBoard((board) => duplicateCard(board, cardId), "immediate")}
          onMove={(cardId, destinationListId) => updateActiveBoard((board) => {
            const destinationList = board.lists[destinationListId];
            return destinationList ? moveCard(board, cardId, destinationListId, destinationList.cardIds.length) : board;
          }, "immediate")}
          onMoveChecklistItem={(itemId, destinationIndex) => updateActiveBoard((board) => moveChecklistItem(board, itemId, destinationIndex), "immediate")}
          onRenameChecklist={(checklistId, title) => updateActiveBoard((board) => renameChecklist(board, checklistId, title), "immediate")}
          onRenameChecklistItem={(itemId, title) => updateActiveBoard((board) => renameChecklistItem(board, itemId, title), "immediate")}
          onSave={(cardId, draft: CardDraft) => updateActiveBoard((board) => updateCard(board, cardId, draft))}
          onToggleChecklistItem={(itemId) => updateActiveBoard((board) => toggleChecklistItem(board, itemId), "immediate")}
          onToggleMember={(cardId, memberId) => updateActiveBoard((board) => toggleCardMember(board, cardId, memberId), "immediate")}
          onUpdateComment={(commentId, message) => updateActiveBoard((board) => updateCardComment(board, commentId, message), "immediate")}
          onUpdateLabel={(labelId, draft) => updateActiveBoard((board) => updateBoardLabel(board, labelId, draft), "immediate")}
          onUpdateMember={(memberId, draft) => updateActiveBoard((board) => updateBoardMember(board, memberId, draft), "immediate")}
        />
      ) : null}

      <QuickCreateCardDialog
        isOpen={isQuickCreateOpen}
        lists={activeLists}
        onClose={() => setIsQuickCreateOpen(false)}
        onCreate={(listId, title) => updateActiveBoard((board) => addCard(board, listId, title), "immediate")}
      />

      <QuickCreateListDialog
        isOpen={isQuickCreateListOpen}
        onClose={() => setIsQuickCreateListOpen(false)}
        onCreate={(title) => updateActiveBoard((board) => addList(board, title), "immediate")}
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
          const nextBoardId = nextWorkspace.activeBoardId ?? nextWorkspace.boards[0]?.id;
          if (nextBoardId) {
            router.replace(getBoardRoute(nextBoardId));
          }
        }}
      />
    </main>
  );
}
