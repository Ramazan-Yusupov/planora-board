"use client";

import {
  CalendarDays,
  Check,
  Link2,
  Plus,
  Settings2,
  Tags,
  X,
} from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import {
  NOTE_STATUS_OPTIONS,
  type Note,
  type NoteStatus,
} from "@/features/manage-notes";
import { cn } from "@/shared/lib";
import {
  Button,
  IconButton,
  TextField,
  useViewportMenuPosition,
} from "@/shared/ui";

import type { NoteTaskItem } from "../lib/notesEditorModel";

type NotePropertiesMenuProps = Readonly<{
  canCreateTask: boolean;
  createTaskDisabledReason?: string;
  note: Note;
  taskItems: readonly NoteTaskItem[];
  onCreateTask: () => void;
  onDueDateChange: (dueDate: string | undefined) => void;
  onLinkedTaskChange: (task: NoteTaskItem | null) => void;
  onOpenLinkedTask: (task: NoteTaskItem) => void;
  onStatusChange: (status: NoteStatus) => void;
  onTagsChange: (tags: string) => void;
}>;

const statusText: Record<NoteStatus, string> = {
  active: "Активная",
  archived: "Архив",
  draft: "Черновик",
};

const statusClasses: Record<NoteStatus, string> = {
  active: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  archived: "border-white/10 bg-white/7 text-text-muted",
  draft: "border-amber-300/25 bg-amber-300/10 text-amber-100",
};

function getTaskValue(task: NoteTaskItem): string {
  return `${task.boardId}:${task.card.id}`;
}

function getSelectedTask(
  note: Note,
  taskItems: readonly NoteTaskItem[],
): NoteTaskItem | null {
  if (!note.linkedBoardId || !note.linkedCardId) {
    return null;
  }

  return (
    taskItems.find(
      (task) =>
        task.boardId === note.linkedBoardId &&
        task.card.id === note.linkedCardId,
    ) ?? null
  );
}

export function NotePropertiesMenu({
  canCreateTask,
  createTaskDisabledReason,
  note,
  taskItems,
  onCreateTask,
  onDueDateChange,
  onLinkedTaskChange,
  onOpenLinkedTask,
  onStatusChange,
  onTagsChange,
}: NotePropertiesMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const linkedTask = getSelectedTask(note, taskItems);
  const tagDefaultValue = note.tags.map((tag) => `#${tag}`).join(", ");
  const { isPositioned, style } = useViewportMenuPosition({
    align: "end",
    anchorRef,
    gap: 8,
    maxHeight: 560,
    menuRef,
    placementKey: `${isOpen}-${note.id}-${note.status}-${note.updatedAt}`,
    width: 360,
  });

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        anchorRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown, true);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown, true);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          aria-label="Свойства заметки"
          className={cn(
            "z-140 overflow-y-auto rounded-2xl border border-white/14 bg-[#151a21] p-2 text-text shadow-[0_24px_70px_rgb(0_0_0/70%)] ring-1 ring-black/40",
            !isPositioned && "pointer-events-none opacity-0",
          )}
          role="menu"
          style={
            {
              ...(style as CSSProperties),
              backgroundColor: "#151a21",
              boxShadow: "0 24px 70px rgb(0 0 0 / 78%)",
              isolation: "isolate",
              zIndex: 1000,
            } as CSSProperties
          }
        >
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Свойства</p>
              <p className="truncate text-xs text-text-muted">
                {note.title || "Без названия"}
              </p>
            </div>
            <IconButton
              className="text-text-muted hover:bg-white/10 hover:text-text"
              label="Закрыть свойства заметки"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X aria-hidden="true" size={16} />
            </IconButton>
          </div>

          <div className="mt-1 border-t border-white/10 pt-2">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Статус
            </p>
            <div className="grid gap-1.5">
              {NOTE_STATUS_OPTIONS.map((option) => {
                const isActive = note.status === option.value;

                return (
                  <button
                    key={option.value}
                    className={cn(
                      "flex min-h-9 w-full items-center gap-3 rounded-lg px-2.5 py-1 text-left text-sm transition hover:bg-white/10",
                      isActive && "bg-white/12 text-text",
                    )}
                    role="menuitemradio"
                    type="button"
                    aria-checked={isActive}
                    onClick={() => onStatusChange(option.value)}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 shrink-0 items-center rounded-full border px-2 text-xs font-semibold whitespace-nowrap",
                        statusClasses[option.value],
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="min-w-0 flex-1 text-text-muted">
                      {option.value === "active"
                        ? "В работе"
                        : option.value === "draft"
                          ? "Пока черновик"
                          : "Скрыть из текущего фокуса"}
                    </span>
                    {isActive ? <Check aria-hidden="true" size={15} /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 border-t border-white/10 pt-2">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Задача
            </p>
            {linkedTask ? (
              <button
                className="mb-2 flex min-h-10 w-full items-center gap-2.5 rounded-lg bg-accent/12 px-2.5 py-1.5 text-left text-sm font-medium text-accent transition hover:bg-accent/18"
                role="menuitem"
                type="button"
                onClick={() => {
                  onOpenLinkedTask(linkedTask);
                  setIsOpen(false);
                }}
              >
                <Link2 aria-hidden="true" className="shrink-0" size={15} />
                <span className="min-w-0 flex-1 truncate">
                  {linkedTask.card.title}
                </span>
              </button>
            ) : null}
            <div className="grid max-h-44 gap-1.5 overflow-y-auto pr-1">
              <button
                className={cn(
                  "flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-sm transition hover:bg-white/10",
                  !linkedTask && "bg-white/12 text-text",
                )}
                role="menuitemradio"
                type="button"
                aria-checked={!linkedTask}
                onClick={() => onLinkedTaskChange(null)}
              >
                <span className="min-w-0 flex-1">Не связана</span>
                {!linkedTask ? <Check aria-hidden="true" size={15} /> : null}
              </button>
              {taskItems.map((task) => {
                const isActive = linkedTask
                  ? getTaskValue(task) === getTaskValue(linkedTask)
                  : false;

                return (
                  <button
                    key={getTaskValue(task)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-white/10",
                      isActive && "bg-white/12 text-text",
                    )}
                    role="menuitemradio"
                    type="button"
                    aria-checked={isActive}
                    onClick={() => onLinkedTaskChange(task)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium leading-5">
                        {task.card.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs leading-4 text-text-muted">
                        {task.listTitle}
                      </span>
                    </span>
                    {isActive ? <Check aria-hidden="true" size={15} /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 grid gap-2 border-t border-white/10 px-2 pt-3">
            <label className="grid gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <CalendarDays aria-hidden="true" size={13} />
                Срок
              </span>
              <div className="flex gap-2">
                <TextField
                  aria-label="Срок заметки"
                  className="h-9"
                  type="date"
                  value={note.dueDate ?? ""}
                  onChange={(event) =>
                    onDueDateChange(event.currentTarget.value || undefined)
                  }
                />
                {note.dueDate ? (
                  <IconButton
                    className="border border-white/10 text-text-muted hover:bg-white/10 hover:text-text"
                    label="Очистить срок заметки"
                    size="md"
                    onClick={() => onDueDateChange(undefined)}
                  >
                    <X aria-hidden="true" size={15} />
                  </IconButton>
                ) : null}
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <Tags aria-hidden="true" size={13} />
                Теги
              </span>
              <TextField
                aria-label="Теги заметки"
                className="h-9"
                defaultValue={tagDefaultValue}
                key={`${note.id}-${tagDefaultValue}`}
                placeholder="#roadmap, #ui"
                onBlur={(event) => onTagsChange(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
              />
            </label>
          </div>

          {note.tags.length > 0 || note.dueDate ? (
            <div className="mt-2 flex flex-wrap gap-1.5 px-2">
              {note.dueDate ? (
                <span className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/7 px-2 text-xs text-text-muted whitespace-nowrap">
                  {new Date(`${note.dueDate}T00:00:00`).toLocaleDateString(
                    "ru-RU",
                  )}
                </span>
              ) : null}
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/7 px-2 text-xs text-text-muted whitespace-nowrap"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-2 border-t border-white/10 px-2 pt-2">
            <Button
              className="h-9 w-full justify-center"
              disabled={!canCreateTask}
              size="sm"
              title={createTaskDisabledReason}
              variant="secondary"
              onClick={() => {
                onCreateTask();
                setIsOpen(false);
              }}
            >
              <Plus aria-hidden="true" size={15} />
              Создать задачу
            </Button>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <div ref={anchorRef} className="flex shrink-0 items-center gap-2 pt-1">
        <span
          className={cn(
            "hidden h-7 items-center rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap sm:inline-flex",
            statusClasses[note.status],
          )}
        >
          {statusText[note.status]}
        </span>
        <IconButton
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className={cn(
            "border border-white/10 bg-control/45 text-text-muted hover:bg-control-hover hover:text-text",
            isOpen && "border-accent/35 bg-accent/10 text-accent",
          )}
          label="Открыть свойства заметки"
          onClick={() => setIsOpen((current) => !current)}
        >
          <Settings2 aria-hidden="true" size={17} />
        </IconButton>
      </div>
      {menu}
    </>
  );
}
