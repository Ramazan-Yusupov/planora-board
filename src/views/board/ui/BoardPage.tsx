"use client";

import { AlertTriangle, Cloud, LayoutDashboard, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { loadActiveBoard, saveActiveBoard, STARTER_BOARD, type Board, type CardDraft } from "@/entities/board";
import {
  addCard,
  addList,
  deleteCard,
  deleteList,
  moveCard,
  moveList,
  renameBoard,
  renameList,
  updateCard,
} from "@/features/board-management";
import { APP_NAME } from "@/shared/config/app";
import { BoardColumns } from "@/widgets/board-columns";
import { CardModal } from "@/widgets/card-modal";

type PersistenceState = "loading" | "saved" | "saving" | "error";

export function BoardPage() {
  const [board, setBoard] = useState<Board>(STARTER_BOARD);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [persistenceState, setPersistenceState] = useState<PersistenceState>("loading");
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    const hydrate = async () => {
      try {
        const storedBoard = await loadActiveBoard();
        if (!isDisposed && storedBoard) {
          setBoard(storedBoard);
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
      void saveActiveBoard(board)
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
  }, [board, isHydrated]);

  const selectedCard = selectedCardId ? board.cards[selectedCardId] : undefined;
  const selectedListTitle = useMemo(() => {
    if (!selectedCard) {
      return "";
    }

    return board.lists[selectedCard.listId]?.title ?? "Удалённый список";
  }, [board.lists, selectedCard]);

  const statusLabel =
    persistenceState === "loading"
      ? "Загружаем доску…"
      : persistenceState === "saving"
        ? "Сохраняем…"
        : persistenceState === "error"
          ? "Ошибка сохранения"
          : "Сохранено локально";

  const applyBoardUpdate = (updater: (currentBoard: Board) => Board) => {
    setBoard((currentBoard) => updater(currentBoard));
  };

  const resetBoard = () => {
    if (window.confirm("Сбросить доску к начальному примеру? Все текущие карточки будут удалены.")) {
      setBoard(STARTER_BOARD);
      setSelectedCardId(null);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col bg-canvas text-text">
      <header className="border-b bg-panel/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm">
              <LayoutDashboard aria-hidden="true" size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{APP_NAME}</p>
              <p className="text-xs text-text-muted">Локальная доска</p>
            </div>
          </div>

          <div className="min-w-0 flex-1 sm:max-w-xl">
            <label className="sr-only" htmlFor="board-title">
              Название доски
            </label>
            <input
              id="board-title"
              className="w-full rounded-xl border border-transparent bg-transparent px-3 py-2 text-lg font-semibold text-text transition hover:border-border focus:border-border focus:bg-panel"
              value={board.title}
              onChange={(event) => applyBoardUpdate((currentBoard) => renameBoard(currentBoard, event.target.value))}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className={`hidden items-center gap-1.5 text-xs font-medium sm:inline-flex ${
              persistenceState === "error" ? "text-danger" : "text-text-muted"
            }`}>
              <Cloud aria-hidden="true" size={15} />
              {statusLabel}
            </span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border bg-panel px-3 text-sm font-medium text-text-muted transition hover:bg-control hover:text-text"
              type="button"
              onClick={resetBoard}
            >
              <RefreshCcw aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Сбросить пример</span>
            </button>
          </div>
        </div>
      </header>

      {storageError ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 sm:px-6">
          <div className="mx-auto flex max-w-[1600px] items-start gap-2 text-sm leading-5">
            <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
            <p>{storageError}</p>
          </div>
        </div>
      ) : null}

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-base font-semibold">Рабочая доска</h1>
            <p className="mt-1 text-sm text-text-muted">Перетаскивайте карточки и списки за значок с точками.</p>
          </div>
          <span className="rounded-lg bg-control px-2.5 py-1 text-xs font-medium text-text-muted">
            {Object.keys(board.cards).length} задач
          </span>
        </div>

        <div className="min-h-0 flex-1">
          <BoardColumns
            board={board}
            onAddCard={(listId, title) => applyBoardUpdate((currentBoard) => addCard(currentBoard, listId, title))}
            onAddList={(title) => applyBoardUpdate((currentBoard) => addList(currentBoard, title))}
            onDeleteList={(listId) => applyBoardUpdate((currentBoard) => deleteList(currentBoard, listId))}
            onMoveCard={(cardId, listId, index) =>
              applyBoardUpdate((currentBoard) => moveCard(currentBoard, cardId, listId, index))
            }
            onMoveList={(listId, destinationListId) =>
              applyBoardUpdate((currentBoard) => moveList(currentBoard, listId, destinationListId))
            }
            onOpenCard={setSelectedCardId}
            onRenameList={(listId, title) =>
              applyBoardUpdate((currentBoard) => renameList(currentBoard, listId, title))
            }
          />
        </div>
      </section>

      {selectedCard ? (
        <CardModal
          key={selectedCard.id}
          card={selectedCard}
          listTitle={selectedListTitle}
          onClose={() => setSelectedCardId(null)}
          onDelete={(cardId) => {
            applyBoardUpdate((currentBoard) => deleteCard(currentBoard, cardId));
          }}
          onSave={(cardId, draft: CardDraft) => {
            applyBoardUpdate((currentBoard) => updateCard(currentBoard, cardId, draft));
          }}
        />
      ) : null}
    </main>
  );
}
