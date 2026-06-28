"use client";

import {
  Check,
  ChevronDown,
  FolderKanban,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Fragment, type FormEvent, useState } from "react";

import type { Board } from "@/entities/board";
import { cn } from "@/shared/lib";
import { Button, ConfirmDialog, IconButton } from "@/shared/ui";

type ProjectSidebarProps = Readonly<{
  boards: Board[];
  activeBoardId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (title: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onSelectBoard: (boardId: string) => void;
}>;

export function ProjectSidebar({
  boards,
  activeBoardId,
  isOpen,
  onClose,
  onCreateBoard,
  onDeleteBoard,
  onSelectBoard,
}: ProjectSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [boardPendingDeletion, setBoardPendingDeletion] =
    useState<Board | null>(null);

  const createProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      return;
    }

    onCreateBoard(normalizedTitle);
    setTitle("");
    setIsCreating(false);
  };

  const deleteDescription = boardPendingDeletion
    ? boards.length === 1
      ? `Проект «${boardPendingDeletion.title}» будет удалён. Вместо него автоматически создастся новый пустой проект.`
      : `Проект «${boardPendingDeletion.title}» со всеми списками и карточками будет удалён без возможности восстановления.`
    : "";

  return (
    <Fragment>
      <aside
        aria-label="Проекты"
        className={cn(
          "absolute inset-y-0 left-0 z-40 flex w-[min(88vw,20rem)] shrink-0 flex-col border-r border-white/10 bg-panel/95 shadow-2xl backdrop-blur-xl transition-transform duration-200 lg:w-72",
          isOpen
            ? "translate-x-0 lg:relative lg:translate-x-0"
            : "-translate-x-full lg:absolute lg:-translate-x-full",
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Навигация
            </p>
            <h2 className="mt-1 text-base font-semibold text-text">Мои проекты</h2>
          </div>
          <IconButton
            className="text-text-muted hover:bg-control hover:text-text"
            label="Закрыть проекты"
            size="lg"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-3 flex items-center gap-2 px-2 text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
            <ChevronDown aria-hidden="true" size={15} />
            <span>Личные доски</span>
            <span className="ml-auto rounded-md bg-control px-1.5 py-0.5 normal-case tracking-normal">
              {boards.length}
            </span>
          </div>

          <nav aria-label="Список проектов">
            <ul className="space-y-1">
              {boards.map((board) => {
                const isActive = board.id === activeBoardId;
                const cardCount = Object.keys(board.cards).length;

                return (
                  <li key={board.id} className="group relative">
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-2 py-2 transition",
                        isActive
                          ? "border-accent/50 bg-accent/15 text-text"
                          : "border-transparent text-text-muted hover:border-white/10 hover:bg-control hover:text-text",
                      )}
                    >
                      <FolderKanban
                        aria-hidden="true"
                        className="shrink-0"
                        size={17}
                      />
                      <button
                        aria-current={isActive ? "page" : undefined}
                        className="min-w-0 flex-1 text-left"
                        type="button"
                        onClick={() => onSelectBoard(board.id)}
                      >
                        <span className="block truncate text-sm font-medium">
                          {board.title}
                        </span>
                        <span className="mt-0.5 block text-xs opacity-70">
                          {cardCount} задач
                        </span>
                      </button>
                      {isActive ? (
                        <Check
                          aria-label="Текущий проект"
                          className="shrink-0 text-accent"
                          size={16}
                        />
                      ) : null}
                      <IconButton
                        className="text-text-muted hover:bg-red-500/15 hover:text-red-300 focus:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        label={`Удалить проект ${board.title}`}
                        size="sm"
                        onClick={() => setBoardPendingDeletion(board)}
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-4 border-t border-white/10 pt-4">
            {isCreating ? (
              <form
                className="rounded-xl border border-white/10 bg-control/45 p-2"
                onSubmit={createProject}
              >
                <label className="sr-only" htmlFor="new-project-title">
                  Название нового проекта
                </label>
                <input
                  autoFocus
                  id="new-project-title"
                  className="h-10 w-full rounded-lg border border-white/10 bg-panel px-3 text-sm text-text placeholder:text-text-muted"
                  placeholder="Например, Запуск сайта"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setTitle("");
                      setIsCreating(false);
                    }
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" type="submit">
                    Создать
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTitle("");
                      setIsCreating(false);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            ) : (
              <button
                className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 text-sm font-medium text-text-muted transition hover:border-accent/60 hover:bg-control hover:text-accent"
                type="button"
                onClick={() => setIsCreating(true)}
              >
                <Plus aria-hidden="true" size={17} />
                Создать проект
              </button>
            )}
          </div>
        </div>
      </aside>

      <ConfirmDialog
        confirmLabel="Удалить проект"
        description={deleteDescription}
        destructive
        isOpen={Boolean(boardPendingDeletion)}
        title="Удалить проект?"
        onCancel={() => setBoardPendingDeletion(null)}
        onConfirm={() => {
          if (!boardPendingDeletion) {
            return;
          }

          onDeleteBoard(boardPendingDeletion.id);
          setBoardPendingDeletion(null);
        }}
      />
    </Fragment>
  );
}
