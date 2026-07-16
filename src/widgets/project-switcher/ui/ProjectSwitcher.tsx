"use client";

import {
  Check,
  ChevronDown,
  FolderKanban,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  BOARD_PROJECT_TEMPLATES,
  type Board,
  type BoardProjectTemplateId,
} from "@/entities/board";
import { cn } from "@/shared/lib";
import { ConfirmDialog, useKeyboardListNavigation } from "@/shared/ui";

type ProjectSwitcherProps = Readonly<{
  activeBoard: Board;
  boards: readonly Board[];
  isOpen: boolean;
  onCreateBoard: (title: string, templateId?: BoardProjectTemplateId) => void;
  onDeleteBoard: (boardId: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onRenameActiveBoard?: (title: string) => void;
  onSelectBoard: (boardId: string) => void;
}>;

function getActiveCardCount(board: Board): number {
  return Object.values(board.cards).filter(
    (card) => !card.isArchived && !board.lists[card.listId]?.isArchived,
  ).length;
}

function isFormFieldTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

export function ProjectSwitcher({
  activeBoard,
  boards,
  isOpen,
  onCreateBoard,
  onDeleteBoard,
  onOpenChange,
  onRenameActiveBoard,
  onSelectBoard,
}: ProjectSwitcherProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [templateId, setTemplateId] =
    useState<BoardProjectTemplateId>("blank");
  const [renameDraft, setRenameDraft] = useState({
    boardId: activeBoard.id,
    title: activeBoard.title,
  });
  const [boardPendingDeletion, setBoardPendingDeletion] =
    useState<Board | null>(null);
  const canCreateProject = newTitle.trim().length > 0;
  const renameTitle =
    renameDraft.boardId === activeBoard.id
      ? renameDraft.title
      : activeBoard.title;
  const boardIds = useMemo(() => boards.map((board) => board.id), [boards]);
  const selectBoardFromMenu = useCallback(
    (index: number) => {
      const boardId = boardIds[index];

      if (!boardId) {
        return;
      }

      onSelectBoard(boardId);
      onOpenChange(false);
    },
    [boardIds, onOpenChange, onSelectBoard],
  );
  const {
    activeIndex,
    activeItemId,
    getItemProps,
    handleKeyDown: handleMenuKeyDown,
  } = useKeyboardListNavigation({
    count: boards.length,
    getItemId: (index) => `project-switcher-board-${boardIds[index] ?? index}`,
    onClose: () => onOpenChange(false),
    onSelect: selectBoardFromMenu,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const handleNavigationKeyDown = (event: KeyboardEvent) => {
      if (isFormFieldTarget(event.target) && event.key !== "Escape") {
        return;
      }

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
        handleMenuKeyDown(event);
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", handleNavigationKeyDown);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", handleNavigationKeyDown);
    };
  }, [handleMenuKeyDown, isOpen, onOpenChange]);

  const createProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = newTitle.trim();

    if (!normalizedTitle) {
      return;
    }

    onCreateBoard(normalizedTitle, templateId);
    setNewTitle("");
    setTemplateId("blank");
    setIsCreating(false);
    onOpenChange(false);
  };

  const saveRename = () => {
    const normalizedTitle = renameTitle.trim();

    if (!normalizedTitle || normalizedTitle === activeBoard.title) {
      setRenameDraft({ boardId: activeBoard.id, title: activeBoard.title });
      return;
    }

    onRenameActiveBoard?.(normalizedTitle);
    setRenameDraft({ boardId: activeBoard.id, title: normalizedTitle });
  };

  const deleteDescription = boardPendingDeletion
    ? boards.length === 1
      ? `Проект «${boardPendingDeletion.title}» будет удалён. Вместо него автоматически создастся новый пустой проект.`
      : `Проект «${boardPendingDeletion.title}» со всеми списками и карточками будет удалён без возможности восстановления.`
    : "";

  return (
    <>
      <div ref={menuRef} className="relative min-w-0">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className={cn(
            "flex h-11 w-full min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-control/45 px-3 text-left text-text shadow-[inset_0_1px_0_rgb(255_255_255_/_3%)] transition hover:border-white/20 hover:bg-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isOpen && "border-accent/55 ring-2 ring-accent/20",
          )}
          type="button"
          onClick={() => onOpenChange(!isOpen)}
        >
          <FolderKanban
            aria-hidden="true"
            className="hidden shrink-0 text-accent sm:block"
            size={18}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {activeBoard.title}
            </span>
            <span className="block truncate text-xs text-text-muted">
              {getActiveCardCount(activeBoard)} активных задач
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "shrink-0 text-text-muted transition",
              isOpen && "rotate-180 text-text",
            )}
            size={17}
          />
        </button>

        {isOpen ? (
          <div
            aria-activedescendant={activeItemId}
            aria-label="Проекты"
            className="absolute left-1/2 top-[calc(100%+0.5rem)] z-70 w-[min(92vw,25rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-panel/98 p-2 shadow-2xl backdrop-blur-xl"
            role="menu"
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
          >
            <div className="flex items-center justify-between gap-3 px-2 py-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  Личные доски
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {boards.length} проектов
                </p>
              </div>
              <button
                aria-label="Создать проект"
                className={cn(
                  "grid size-9 place-items-center rounded-xl border border-white/10 text-text-muted transition hover:border-accent/55 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCreating && "border-accent/55 bg-accent/10 text-accent",
                )}
                type="button"
                onClick={() => setIsCreating((current) => !current)}
              >
                <Plus aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="max-h-[15rem] overflow-y-auto px-1 py-1">
              {boards.map((board, boardIndex) => {
                const isActive = board.id === activeBoard.id;
                const isKeyboardActive = activeIndex === boardIndex;

                return (
                  <div
                    key={board.id}
                    className={cn(
                      "group flex min-h-12 w-full min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 transition",
                      isActive || isKeyboardActive
                        ? "bg-accent/15 text-text"
                        : "text-text-muted hover:bg-control hover:text-text",
                    )}
                    role="none"
                  >
                    <button
                      {...getItemProps(boardIndex)}
                      aria-current={isActive ? "page" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        onSelectBoard(board.id);
                        onOpenChange(false);
                      }}
                    >
                      <FolderKanban
                        aria-hidden="true"
                        className="shrink-0"
                        size={17}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {board.title}
                        </span>
                        <span className="block truncate text-xs opacity-70">
                          {getActiveCardCount(board)} активных задач
                        </span>
                      </span>
                    </button>
                    {isActive ? (
                      <Check
                        aria-hidden="true"
                        className="shrink-0 text-accent"
                        size={16}
                      />
                    ) : null}
                    <button
                      aria-label={`Удалить проект ${board.title}`}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted opacity-70 transition hover:bg-red-500/15 hover:text-red-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40 lg:opacity-0 lg:group-hover:opacity-100"
                      type="button"
                      onClick={() => setBoardPendingDeletion(board)}
                    >
                      <Trash2 aria-hidden="true" size={15} />
                    </button>
                  </div>
                );
              })}
            </div>

            {onRenameActiveBoard ? (
              <div className="border-t border-white/10 px-2 py-3">
                <label
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted"
                  htmlFor="active-project-rename"
                >
                  Название текущего проекта
                </label>
                <input
                  id="active-project-rename"
                  className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm font-medium text-text outline-none transition placeholder:text-text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20"
                  value={renameTitle}
                  onBlur={saveRename}
                  onChange={(event) =>
                    setRenameDraft({
                      boardId: activeBoard.id,
                      title: event.target.value,
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }

                    if (event.key === "Escape") {
                      setRenameDraft({
                        boardId: activeBoard.id,
                        title: activeBoard.title,
                      });
                      event.currentTarget.blur();
                    }
                  }}
                />
              </div>
            ) : null}

            {isCreating ? (
              <form
                className="border-t border-white/10 px-2 py-3"
                onSubmit={createProject}
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  <Sparkles aria-hidden="true" size={14} />
                  Новый проект
                </div>
                <input
                  autoFocus
                  className="h-10 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20"
                  placeholder="Например, Mobile App"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                />
                <select
                  className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text outline-none transition focus:border-accent/55 focus:ring-2 focus:ring-accent/20"
                  value={templateId}
                  onChange={(event) =>
                    setTemplateId(event.target.value as BoardProjectTemplateId)
                  }
                >
                  {BOARD_PROJECT_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <button
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={!canCreateProject}
                    type="submit"
                  >
                    Создать
                  </button>
                  <button
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-white/10 px-3 text-sm font-semibold text-text-muted transition hover:bg-control hover:text-text"
                    type="button"
                    onClick={() => {
                      setNewTitle("");
                      setTemplateId("blank");
                      setIsCreating(false);
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>

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
          onOpenChange(false);
        }}
      />
    </>
  );
}
