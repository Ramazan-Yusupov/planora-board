"use client";

import {
  AlertTriangle,
  Cloud,
  LayoutDashboard,
  Menu,
  Palette,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  createStarterBoard,
  loadBoardWorkspace,
  resolveBoardAppearance,
  saveBoardWorkspace,
  type Board,
  type BoardWorkspace,
  type CardDraft,
} from "@/entities/board";
import {
  addCard,
  addList,
  createBoard,
  deleteCard,
  deleteList,
  moveCard,
  moveList,
  renameBoard,
  renameList,
  updateBoardAppearance,
  updateCard,
} from "@/features/board-management";
import { APP_NAME } from "@/shared/config/app";
import { BoardAppearanceSidebar } from "@/widgets/board-appearance";
import { BoardColumns } from "@/widgets/board-columns";
import { CardModal } from "@/widgets/card-modal";
import { ProjectSidebar } from "@/widgets/project-sidebar";

type PersistenceState = "loading" | "saved" | "saving" | "error";

function createInitialWorkspace(): BoardWorkspace {
  const starterBoard = createStarterBoard();

  return {
    boards: [starterBoard],
    activeBoardId: starterBoard.id,
  };
}

function isMobileViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 1023px)").matches
  );
}

function BoardLoadingState() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid h-full place-items-center px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6"
    >
      <p className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm">
        Загружаем доску…
      </p>
    </div>
  );
}

type BoardTitleInputProps = Readonly<{
  title: string;
  onCommit: (title: string) => void;
}>;

function BoardTitleInput({ title, onCommit }: BoardTitleInputProps) {
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
      className="w-full rounded-xl border border-transparent bg-transparent px-2 py-2 text-base font-semibold text-text transition hover:border-white/10 focus:border-white/10 focus:bg-control sm:px-3 sm:text-lg"
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
          event.currentTarget.value = title;
          setDraft(title);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export function BoardPage() {
  const [workspace, setWorkspace] = useState<BoardWorkspace>(
    createInitialWorkspace,
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBoardReady, setIsBoardReady] = useState(false);
  const [persistenceState, setPersistenceState] =
    useState<PersistenceState>("loading");
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

  const activeBoard = useMemo(() => {
    const requestedBoard = workspace.boards.find(
      (board) => board.id === workspace.activeBoardId,
    );
    return requestedBoard ?? workspace.boards.at(0) ?? null;
  }, [workspace.activeBoardId, workspace.boards]);

  useEffect(() => {
    let isDisposed = false;

    const hydrate = async () => {
      try {
        const loadedWorkspace = await loadBoardWorkspace();
        if (!isDisposed && loadedWorkspace.boards.length > 0) {
          setWorkspace(loadedWorkspace);
        }
      } catch (error) {
        if (!isDisposed) {
          setStorageError(
            error instanceof Error
              ? `Не удалось открыть локальное хранилище: ${error.message}`
              : "Не удалось открыть локальное хранилище.",
          );
        }
      } finally {
        if (!isDisposed) {
          setIsHydrated(true);
          setIsBoardReady(true);
          setPersistenceState("saved");
        }
      }
    };

    void hydrate();
    return () => {
      isDisposed = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPersistenceState("saving");
      void saveBoardWorkspace(workspace)
        .then(() => {
          setPersistenceState("saved");
          setStorageError(null);
        })
        .catch((error: unknown) => {
          setPersistenceState("error");
          setStorageError(
            error instanceof Error
              ? `Изменения не сохранены: ${error.message}`
              : "Изменения не сохранены.",
          );
        });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isHydrated, workspace]);

  const selectedCard =
    selectedCardId && activeBoard
      ? activeBoard.cards[selectedCardId]
      : undefined;
  const selectedListTitle = useMemo(() => {
    if (!selectedCard || !activeBoard) {
      return "";
    }

    return activeBoard.lists[selectedCard.listId]?.title ?? "Удалённый список";
  }, [activeBoard, selectedCard]);
  const resolvedAppearance = activeBoard
    ? resolveBoardAppearance(activeBoard.appearance)
    : null;

  const statusLabel =
    persistenceState === "loading"
      ? "Загружаем доски…"
      : persistenceState === "saving"
        ? "Сохраняем…"
        : persistenceState === "error"
          ? "Ошибка сохранения"
          : "Сохранено локально";

  const updateActiveBoard = (updater: (currentBoard: Board) => Board) => {
    setWorkspace((currentWorkspace) => {
      const currentBoard = currentWorkspace.boards.find(
        (board) => board.id === currentWorkspace.activeBoardId,
      );
      if (!currentBoard) {
        return currentWorkspace;
      }

      const nextBoard = updater(currentBoard);
      return {
        ...currentWorkspace,
        boards: currentWorkspace.boards.map((board) =>
          board.id === currentBoard.id ? nextBoard : board,
        ),
      };
    });
  };

  const createProject = (title: string) => {
    const nextBoard = createBoard(title);
    setWorkspace((currentWorkspace) => ({
      boards: [...currentWorkspace.boards, nextBoard],
      activeBoardId: nextBoard.id,
    }));
    setSelectedCardId(null);
    setIsProjectsOpen(false);
  };

  const selectProject = (boardId: string) => {
    setWorkspace((currentWorkspace) => ({
      ...currentWorkspace,
      activeBoardId: boardId,
    }));
    setSelectedCardId(null);
    setIsAppearanceOpen(false);

    if (isMobileViewport()) {
      setIsProjectsOpen(false);
    }
  };

  const deleteProject = (boardId: string) => {
    setWorkspace((currentWorkspace) => {
      const remainingBoards = currentWorkspace.boards.filter(
        (board) => board.id !== boardId,
      );
      if (remainingBoards.length === 0) {
        const fallbackBoard = createBoard("Новый проект");
        return {
          boards: [fallbackBoard],
          activeBoardId: fallbackBoard.id,
        };
      }

      const nextActiveBoardId =
        currentWorkspace.activeBoardId === boardId
          ? remainingBoards[0].id
          : currentWorkspace.activeBoardId;

      return {
        boards: remainingBoards,
        activeBoardId: nextActiveBoardId,
      };
    });
    setSelectedCardId(null);
  };

  const toggleProjects = () => {
    setIsProjectsOpen((current) => !current);
    setIsAppearanceOpen(false);
  };

  const toggleAppearance = () => {
    setIsAppearanceOpen((current) => !current);
    setIsProjectsOpen(false);
  };

  if (!activeBoard || !resolvedAppearance) {
    return null;
  }

  return (
    <main className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-canvas text-text">
      <header className="z-50 border-b border-white/10 bg-panel/95 px-3 py-3 backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex max-w-[1800px] items-center gap-2 sm:gap-4">
          <button
            aria-label={isProjectsOpen ? "Закрыть проекты" : "Открыть проекты"}
            aria-pressed={isProjectsOpen}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-text-muted transition hover:bg-control hover:text-text"
            type="button"
            onClick={toggleProjects}
          >
            <Menu aria-hidden="true" size={20} />
          </button>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm shadow-accent/20">
              <LayoutDashboard aria-hidden="true" size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {APP_NAME}
              </p>
              <p className="text-xs text-text-muted">Локальные проекты</p>
            </div>
          </div>

          <div className="min-w-0 flex-1 sm:max-w-xl">
            <label className="sr-only" htmlFor="board-title">
              Название проекта
            </label>
            <BoardTitleInput
              key={activeBoard.id}
              title={activeBoard.title}
              onCommit={(title) =>
                updateActiveBoard((board) => renameBoard(board, title))
              }
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <span
              className={`hidden items-center gap-1.5 text-xs font-medium md:inline-flex ${
                persistenceState === "error"
                  ? "text-red-300"
                  : "text-text-muted"
              }`}
            >
              <Cloud aria-hidden="true" size={15} />
              {statusLabel}
            </span>
            <button
              aria-label="Оформление доски"
              aria-pressed={isAppearanceOpen}
              className={`grid size-10 place-items-center rounded-xl transition ${
                isAppearanceOpen
                  ? "bg-accent text-accent-foreground"
                  : "text-text-muted hover:bg-control hover:text-text"
              }`}
              type="button"
              onClick={toggleAppearance}
            >
              <Palette aria-hidden="true" size={19} />
            </button>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isProjectsOpen || isAppearanceOpen ? (
          <button
            aria-label="Закрыть боковую панель"
            className="absolute inset-0 z-30 bg-black/55 lg:hidden"
            type="button"
            onClick={() => {
              setIsProjectsOpen(false);
              setIsAppearanceOpen(false);
            }}
          />
        ) : null}

        <ProjectSidebar
          activeBoardId={workspace.activeBoardId}
          boards={workspace.boards}
          isOpen={isProjectsOpen}
          onClose={() => setIsProjectsOpen(false)}
          onCreateBoard={createProject}
          onDeleteBoard={deleteProject}
          onSelectBoard={selectProject}
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
                  style={{ color: resolvedAppearance.canvasMutedTextColor }}
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
              {isBoardReady ? (
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
                  onOpenCard={setSelectedCardId}
                  onRenameList={(listId, title) =>
                    updateActiveBoard((board) =>
                      renameList(board, listId, title),
                    )
                  }
                />
              ) : (
                <BoardLoadingState />
              )}
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
          onClose={() => setSelectedCardId(null)}
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
