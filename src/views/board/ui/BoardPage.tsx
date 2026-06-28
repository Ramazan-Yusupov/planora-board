"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { resolveBoardAppearance, type CardDraft } from "@/entities/board";
import {
  addCard,
  addList,
  deleteCard,
  deleteList,
  moveCard,
  moveList,
  renameBoard,
  renameList,
  updateBoardAppearance,
  updateCard,
} from "@/features/board-management";
import { useBoardWorkspace } from "@/features/manage-board-workspace";
import { CALENDAR_ROUTE, getBoardRoute } from "@/shared/config/routes";
import { BoardAppearanceSidebar } from "@/widgets/board-appearance";
import { BoardColumns } from "@/widgets/board-columns";
import { CardModal } from "@/widgets/card-modal";
import { ProjectSidebar } from "@/widgets/project-sidebar";
import { WorkspaceHeader } from "@/widgets/workspace-header";

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
    <input
      id="board-title"
      className="w-full rounded-xl border border-transparent bg-transparent px-2 py-2 text-base font-semibold text-text transition hover:border-white/10 focus:border-white/10 focus:bg-control disabled:cursor-wait disabled:opacity-60 sm:px-3 sm:text-lg"
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
    createProject,
    deleteProject,
    selectProject,
    updateActiveBoard,
  } = useBoardWorkspace();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isInitialCardDismissed, setIsInitialCardDismissed] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

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

  const isRequestedBoardReady =
    isReady && Boolean(workspace) && activeBoard?.id === boardId;

  if (!isRequestedBoardReady || !workspace || !activeBoard) {
    return <BoardLoadingState />;
  }

  const selectedCard = selectedCardId
    ? activeBoard.cards[selectedCardId]
    : !isInitialCardDismissed && initialCardId
      ? activeBoard.cards[initialCardId]
      : undefined;
  const selectedListTitle = selectedCard
    ? activeBoard.lists[selectedCard.listId]?.title ?? "Удалённый список"
    : "";
  const resolvedAppearance = resolveBoardAppearance(activeBoard.appearance);
  const statusLabel =
    persistenceState === "saving"
      ? "Сохраняем…"
      : persistenceState === "error"
        ? "Ошибка сохранения"
        : "Сохранено локально";

  const closeSidebars = () => {
    setIsProjectsOpen(false);
    setIsAppearanceOpen(false);
  };

  const selectProjectFromSidebar = (nextBoardId: string) => {
    selectProject(nextBoardId);
    setSelectedCardId(null);
    setIsInitialCardDismissed(true);
    setIsAppearanceOpen(false);
    router.push(getBoardRoute(nextBoardId));

    if (isMobileViewport()) {
      setIsProjectsOpen(false);
    }
  };

  const toggleProjects = () => {
    setIsProjectsOpen((current) => !current);
    setIsAppearanceOpen(false);
  };

  const toggleAppearance = () => {
    setIsAppearanceOpen((current) => !current);
    setIsProjectsOpen(false);
  };

  const openCalendar = () => {
    closeSidebars();
    router.push(CALENDAR_ROUTE);
  };

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <WorkspaceHeader
        activeView="board"
        isAppearanceOpen={isAppearanceOpen}
        isPersistenceError={persistenceState === "error"}
        isProjectsOpen={isProjectsOpen}
        persistenceLabel={statusLabel}
        onOpenBoard={() => router.push(getBoardRoute(activeBoard.id))}
        onOpenCalendar={openCalendar}
        onToggleAppearance={toggleAppearance}
        onToggleProjects={toggleProjects}
      >
        <label className="sr-only" htmlFor="board-title">
          Название проекта
        </label>
        <BoardTitleInput
          key={activeBoard.id}
          disabled={!isReady}
          title={activeBoard.title}
          onCommit={(title) =>
            updateActiveBoard(
              (board) => renameBoard(board, title),
              "immediate",
            )
          }
        />
      </WorkspaceHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isProjectsOpen || isAppearanceOpen ? (
          <button
            aria-label="Закрыть боковую панель"
            className="absolute inset-0 z-30 bg-black/55 lg:hidden"
            type="button"
            onClick={closeSidebars}
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
              setIsProjectsOpen(false);
              router.push(getBoardRoute(createdBoardId));
            }
          }}
          onDeleteBoard={(deletedBoardId) => {
            const nextActiveBoardId = deleteProject(deletedBoardId);
            setSelectedCardId(null);
            setIsInitialCardDismissed(true);

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
            <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-6">
              <div>
                <h1 className="text-base font-semibold">Рабочая доска</h1>

                <p
                  className="mt-1 text-sm"
                  style={{
                    color: resolvedAppearance.canvasMutedTextColor,
                  }}
                >
                  Перетаскивайте карточки и списки за значок с точками.
                </p>
              </div>

              <span
                className="rounded-lg px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.35)",
                  color: resolvedAppearance.canvasTextColor,
                }}
              >
                {Object.keys(activeBoard.cards).length} задач
              </span>
            </div>

            <div className="min-h-0 flex-1">
              <BoardColumns
                appearance={resolvedAppearance}
                board={activeBoard}
                onAddCard={(listId, title) =>
                  updateActiveBoard((board) => addCard(board, listId, title))
                }
                onAddList={(title) =>
                  updateActiveBoard((board) => addList(board, title))
                }
                onDeleteList={(listId) =>
                  updateActiveBoard((board) => deleteList(board, listId))
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
                  setSelectedCardId(cardId);
                }}
                onRenameList={(listId, title) =>
                  updateActiveBoard((board) => renameList(board, listId, title))
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
      </div>

      {selectedCard ? (
        <CardModal
          key={selectedCard.id}
          card={selectedCard}
          listTitle={selectedListTitle}
          onClose={() => {
            setIsInitialCardDismissed(true);
            setSelectedCardId(null);
          }}
          onDelete={(cardId) => {
            updateActiveBoard((board) => deleteCard(board, cardId));
          }}
          onSave={(cardId, draft: CardDraft) => {
            updateActiveBoard((board) => updateCard(board, cardId, draft));
          }}
        />
      ) : null}
    </main>
  );
}
