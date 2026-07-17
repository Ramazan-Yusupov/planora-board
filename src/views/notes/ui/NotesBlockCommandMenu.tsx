"use client";

import { Plus } from "lucide-react";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib";
import { useKeyboardListNavigation, useViewportMenuPosition } from "@/shared/ui";

import type {
  BlockCommand,
  NoteTaskCreateTarget,
  NoteTaskItem,
} from "../lib/notesEditorModel";

type BlockCommandMenuItem =
  | Readonly<{
      command: BlockCommand;
      id: string;
      type: "command";
    }>
  | Readonly<{
      id: string;
      target: NoteTaskCreateTarget;
      type: "create-task";
    }>
  | Readonly<{
      id: string;
      task: NoteTaskItem;
      type: "task";
    }>;

type NotesBlockCommandMenuProps = Readonly<{
  anchorRef: RefObject<HTMLDivElement | null>;
  commands: readonly BlockCommand[];
  showTaskCreateSection: boolean;
  taskCreateTargets: readonly NoteTaskCreateTarget[];
  tasks: readonly NoteTaskItem[];
  onClose: () => void;
  onCreateTask: (target: NoteTaskCreateTarget) => void;
  onSelect: (command: BlockCommand) => void;
  onSelectTask: (task: NoteTaskItem) => void;
}>;

export function NotesBlockCommandMenu({
  anchorRef,
  commands,
  showTaskCreateSection,
  taskCreateTargets,
  tasks,
  onClose,
  onCreateTask,
  onSelect,
  onSelectTask,
}: NotesBlockCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { style: menuStyle } = useViewportMenuPosition({
    anchorRef,
    maxHeight: 440,
    menuRef,
    width: 352,
  });
  const menuItems = useMemo<readonly BlockCommandMenuItem[]>(
    () => [
      ...commands.map((command) => ({
        command,
        id: `command-${command.id}`,
        type: "command" as const,
      })),
      ...(showTaskCreateSection
        ? taskCreateTargets.map((target) => ({
            id: `create-task-${target.listId}`,
            target,
            type: "create-task" as const,
          }))
        : []),
      ...tasks.map((task) => ({
        id: `task-${task.boardId}-${task.card.id}`,
        task,
        type: "task" as const,
      })),
    ],
    [commands, showTaskCreateSection, taskCreateTargets, tasks],
  );
  const activateMenuItem = useCallback(
    (index: number) => {
      const item = menuItems[index];

      if (!item) {
        return;
      }

      if (item.type === "command") {
        onSelect(item.command);
        return;
      }

      if (item.type === "create-task") {
        if (!item.target.isDisabled) {
          onCreateTask(item.target);
        }
        return;
      }

      onSelectTask(item.task);
    },
    [menuItems, onCreateTask, onSelect, onSelectTask],
  );
  const isMenuItemDisabled = useCallback(
    (index: number) => {
      const item = menuItems[index];

      return item?.type === "create-task" ? item.target.isDisabled : false;
    },
    [menuItems],
  );
  const {
    activeIndex,
    activeItemId,
    getItemProps,
    handleKeyDown: handleMenuKeyDown,
  } = useKeyboardListNavigation({
    count: menuItems.length,
    getItemId: (index) => `notes-slash-menu-${menuItems[index]?.id ?? index}`,
    isItemDisabled: isMenuItemDisabled,
    onClose,
    onSelect: activateMenuItem,
  });

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const handleNavigationKeyDown = (event: globalThis.KeyboardEvent) => {
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

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", handleNavigationKeyDown);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", handleNavigationKeyDown);
    };
  }, [handleMenuKeyDown, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      aria-activedescendant={activeItemId}
      className="flex flex-col overflow-hidden rounded-lg border border-white/12 bg-[#242424] text-white shadow-2xl"
      role="menu"
      style={{
        ...menuStyle,
        zIndex: 85,
      }}
      tabIndex={-1}
      onKeyDown={handleMenuKeyDown}
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="min-h-24 flex-1 overflow-y-auto p-1.5">
        <p className="px-2 py-1.5 text-xs font-semibold text-white/45">
          Basic blocks
        </p>
        {commands.length > 0 ? (
          commands.map((command, commandIndex) => (
            <button
              key={command.id}
              {...getItemProps(commandIndex)}
              className={cn(
                "flex min-h-10 w-full items-center gap-3 rounded-md px-2.5 text-left text-sm transition hover:bg-white/10 focus:bg-white/10 focus:outline-none",
                activeIndex === commandIndex && "bg-white/10",
              )}
              role="menuitem"
              type="button"
              onClick={() => onSelect(command)}
            >
              <span className="grid size-6 shrink-0 place-items-center text-white/78">
                {command.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white/90">
                  {command.title}
                </span>
                <span className="block truncate text-xs text-white/42">
                  {command.description}
                </span>
              </span>
              {command.shortcut ? (
                <span className="shrink-0 font-mono text-xs text-white/32">
                  {command.shortcut}
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <p className="px-2.5 py-6 text-center text-sm text-white/45">
            Ничего не найдено
          </p>
        )}
      </div>
      {showTaskCreateSection ? (
        <div className="shrink-0 border-t border-white/10 p-1.5">
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <p className="text-xs font-semibold text-white/45">
              Создать задачу
            </p>
            <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/38">
              {taskCreateTargets.length}
            </span>
          </div>
          <div className="max-h-27 overflow-x-hidden overflow-y-auto pr-1">
            {taskCreateTargets.length > 0 ? (
              <div className="grid min-w-0 gap-1">
                {taskCreateTargets.map((target, targetIndex) => {
                  const itemIndex = commands.length + targetIndex;

                  return (
                    <button
                      key={target.listId}
                      {...getItemProps(itemIndex)}
                      className={cn(
                        "flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 text-left text-sm transition focus:border-accent/60 focus:outline-none",
                        target.isDisabled
                          ? "cursor-not-allowed opacity-45"
                          : "hover:border-accent/45 hover:bg-white/10",
                        activeIndex === itemIndex &&
                          !target.isDisabled &&
                          "border-accent/45 bg-white/10",
                      )}
                      disabled={target.isDisabled}
                      role="menuitem"
                      title={
                        target.disabledReason
                          ? `${target.listTitle}: ${target.disabledReason}`
                          : `Создать задачу в «${target.listTitle}»`
                      }
                      type="button"
                      onClick={() => onCreateTask(target)}
                    >
                      <Plus
                        aria-hidden="true"
                        className="shrink-0 text-accent"
                        size={16}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block max-w-full truncate font-semibold text-white/90">
                          {target.listTitle}
                        </span>
                        <span className="block max-w-full truncate text-xs text-white/42">
                          {target.disabledReason ?? "Из текущей строки"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-2.5 py-4 text-center text-sm text-white/45">
                Нет доступных списков
              </p>
            )}
          </div>
        </div>
      ) : null}
      <div className="shrink-0 border-t border-white/10 p-1.5">
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <p className="text-xs font-semibold text-white/45">Задачи доски</p>
          <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/38">
            {tasks.length}
          </span>
        </div>
        <div className="max-h-27 overflow-x-hidden overflow-y-auto pr-1">
          {tasks.length > 0 ? (
            <div className="grid min-w-0 gap-1">
              {tasks.map((task, taskIndex) => {
                const itemIndex =
                  commands.length +
                  (showTaskCreateSection ? taskCreateTargets.length : 0) +
                  taskIndex;

                return (
                  <button
                    key={`${task.boardId}-${task.card.id}`}
                    {...getItemProps(itemIndex)}
                    className={cn(
                      "flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-white/8 bg-white/4 px-2.5 py-2 text-left text-sm transition hover:border-accent/45 hover:bg-white/10 focus:border-accent/60 focus:outline-none",
                      activeIndex === itemIndex && "border-accent/45 bg-white/10",
                    )}
                    role="menuitem"
                    title={`${task.boardTitle}: ${task.card.title}`}
                    type="button"
                    onClick={() => onSelectTask(task)}
                  >
                    {task.card.sticker ? (
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-base leading-none"
                      >
                        {task.card.sticker}
                      </span>
                    ) : (
                      <span className="size-2 shrink-0 rounded-full bg-accent" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block max-w-full truncate font-semibold text-white/90">
                        {task.card.title}
                      </span>
                      <span className="block max-w-full truncate text-xs text-white/42">
                        {task.listTitle}
                        {task.card.dueDate ? ` · ${task.card.dueDate}` : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-2.5 py-4 text-center text-sm text-white/45">
              В этой доске нет задач
            </p>
          )}
        </div>
      </div>
      <div className="flex min-h-10 items-center justify-between border-t border-white/10 px-3 text-sm">
        <button
          className="font-medium text-white/85 transition hover:text-white"
          type="button"
          onClick={onClose}
        >
          Close menu
        </button>
        <span className="text-xs text-white/35">esc</span>
      </div>
    </div>,
    document.body,
  );
}
