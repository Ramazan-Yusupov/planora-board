"use client";

import {
  CheckSquare2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import {
  getChecklistItems,
  type BoardChecklist,
  type BoardChecklistItem,
} from "@/entities/board";
import { cn } from "@/shared/lib";
import { Button, ConfirmDialog, IconButton } from "@/shared/ui";

type CardChecklistsEditorProps = Readonly<{
  checklists: readonly BoardChecklist[];
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  onCreateChecklist: (title: string) => void;
  onCreateItem: (checklistId: string, title: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItem: (itemId: string, destinationIndex: number) => void;
  onRenameChecklist: (checklistId: string, title: string) => void;
  onRenameItem: (itemId: string, title: string) => void;
  onToggleItem: (itemId: string) => void;
}>;

type ChecklistTitleInputProps = Readonly<{
  title: string;
  onSave: (title: string) => void;
}>;

function ChecklistTitleInput({ title, onSave }: ChecklistTitleInputProps) {
  const [draft, setDraft] = useState(title);

  const commit = () => {
    const normalizedTitle = draft.trim().replace(/\s+/g, " ");

    if (!normalizedTitle) {
      setDraft(title);
      return;
    }

    if (normalizedTitle !== title) {
      onSave(normalizedTitle);
    }
  };

  return (
    <input
      aria-label="Название чек-листа"
      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-text outline-none transition hover:border-white/10 focus:border-white/10 focus:bg-panel/60"
      value={draft}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }

        if (event.key === "Escape") {
          setDraft(title);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

type ChecklistItemRowProps = Readonly<{
  item: BoardChecklistItem;
  index: number;
  totalItems: number;
  onDelete: (itemId: string) => void;
  onMove: (itemId: string, destinationIndex: number) => void;
  onRename: (itemId: string, title: string) => void;
  onToggle: (itemId: string) => void;
}>;

function ChecklistItemRow({
  item,
  index,
  totalItems,
  onDelete,
  onMove,
  onRename,
  onToggle,
}: ChecklistItemRowProps) {
  const [draft, setDraft] = useState(item.title);

  const commit = () => {
    const normalizedTitle = draft.trim().replace(/\s+/g, " ");

    if (!normalizedTitle) {
      setDraft(item.title);
      return;
    }

    if (normalizedTitle !== item.title) {
      onRename(item.id, normalizedTitle);
    }
  };

  return (
    <li className="group flex items-center gap-1.5 rounded-xl px-1 py-1 transition hover:bg-panel/35">
      <input
        aria-label={`Отметить пункт «${item.title}»`}
        checked={item.isCompleted}
        className="size-4 shrink-0 accent-[var(--app-accent)]"
        type="checkbox"
        onChange={() => onToggle(item.id)}
      />
      <input
        aria-label="Название пункта чек-листа"
        className={cn(
          "min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-text outline-none transition hover:border-white/10 focus:border-white/10 focus:bg-panel/60",
          item.isCompleted && "text-text-muted line-through",
        )}
        value={draft}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            setDraft(item.title);
            event.currentTarget.blur();
          }
        }}
      />
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <IconButton
          className="text-text-muted hover:bg-panel hover:text-text disabled:opacity-30"
          disabled={index === 0}
          label={`Поднять пункт «${item.title}»`}
          size="sm"
          onClick={() => onMove(item.id, index - 1)}
        >
          <ChevronUp aria-hidden="true" size={15} />
        </IconButton>
        <IconButton
          className="text-text-muted hover:bg-panel hover:text-text disabled:opacity-30"
          disabled={index === totalItems - 1}
          label={`Опустить пункт «${item.title}»`}
          size="sm"
          onClick={() => onMove(item.id, index + 1)}
        >
          <ChevronDown aria-hidden="true" size={15} />
        </IconButton>
        <IconButton
          className="text-text-muted hover:bg-red-500/15 hover:text-red-300"
          label={`Удалить пункт «${item.title}»`}
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 aria-hidden="true" size={15} />
        </IconButton>
      </div>
    </li>
  );
}

type ChecklistItemComposerProps = Readonly<{
  checklistId: string;
  onCreateItem: (checklistId: string, title: string) => void;
}>;

function ChecklistItemComposer({
  checklistId,
  onCreateItem,
}: ChecklistItemComposerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const canCreateItem = draft.trim().length > 0;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = draft.trim();

    if (!normalizedTitle) {
      return;
    }

    onCreateItem(checklistId, normalizedTitle);
    setDraft("");
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-text-muted transition hover:bg-panel/50 hover:text-text"
        type="button"
        onClick={() => setIsAdding(true)}
      >
        <Plus aria-hidden="true" size={16} />
        Добавить пункт
      </button>
    );
  }

  return (
    <form className="mt-2 flex items-center gap-2" onSubmit={submit}>
      <label className="sr-only" htmlFor={`checklist-item-${checklistId}`}>
        Новый пункт чек-листа
      </label>
      <input
        autoFocus
        id={`checklist-item-${checklistId}`}
        className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-panel/55 px-3 text-sm text-text placeholder:text-text-muted"
        placeholder="Например, согласовать макет"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft("");
            setIsAdding(false);
          }
        }}
      />
      <Button disabled={!canCreateItem} size="sm" type="submit">
        Добавить
      </Button>
      <IconButton
        className="text-text-muted hover:bg-panel hover:text-text"
        label="Отменить создание пункта"
        size="sm"
        onClick={() => {
          setDraft("");
          setIsAdding(false);
        }}
      >
        <X aria-hidden="true" size={17} />
      </IconButton>
    </form>
  );
}

type ChecklistBlockProps = Omit<
  CardChecklistsEditorProps,
  "checklists" | "onCreateChecklist"
> & {
  checklist: BoardChecklist;
};

function ChecklistBlock({
  checklist,
  checklistItems,
  onCreateItem,
  onDeleteChecklist,
  onDeleteItem,
  onMoveItem,
  onRenameChecklist,
  onRenameItem,
  onToggleItem,
}: ChecklistBlockProps) {
  const items = useMemo(
    () => getChecklistItems(checklist, checklistItems),
    [checklist, checklistItems],
  );
  const completedItemsCount = items.filter((item) => item.isCompleted).length;
  const progress = items.length
    ? Math.round((completedItemsCount / items.length) * 100)
    : 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-control/25 p-3 sm:p-4">
      <div className="flex items-center gap-1">
        <ListChecks aria-hidden="true" className="shrink-0 text-accent" size={18} />
        <ChecklistTitleInput
          key={`${checklist.id}-${checklist.title}`}
          title={checklist.title}
          onSave={(title) => onRenameChecklist(checklist.id, title)}
        />
        <IconButton
          className="text-text-muted hover:bg-red-500/15 hover:text-red-300"
          label={`Удалить чек-лист «${checklist.title}»`}
          size="sm"
          onClick={() => onDeleteChecklist(checklist.id)}
        >
          <Trash2 aria-hidden="true" size={16} />
        </IconButton>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-panel/70">
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-text-muted">
          {completedItemsCount}/{items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-1" aria-label={`Пункты: ${checklist.title}`}>
          {items.map((item, index) => (
            <ChecklistItemRow
              key={`${item.id}-${item.title}`}
              index={index}
              item={item}
              totalItems={items.length}
              onDelete={onDeleteItem}
              onMove={onMoveItem}
              onRename={onRenameItem}
              onToggle={onToggleItem}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Добавьте пункты, чтобы видеть прогресс задачи.
        </p>
      )}

      <ChecklistItemComposer
        checklistId={checklist.id}
        onCreateItem={onCreateItem}
      />
    </section>
  );
}

export function CardChecklistsEditor({
  checklists,
  checklistItems,
  onCreateChecklist,
  onCreateItem,
  onDeleteChecklist,
  onDeleteItem,
  onMoveItem,
  onRenameChecklist,
  onRenameItem,
  onToggleItem,
}: CardChecklistsEditorProps) {
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistIdToDelete, setChecklistIdToDelete] = useState<string | null>(
    null,
  );
  const checklistToDelete = checklistIdToDelete
    ? checklists.find((checklist) => checklist.id === checklistIdToDelete) ?? null
    : null;
  const canCreateChecklist = checklistTitle.trim().length > 0;

  const createChecklist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = checklistTitle.trim();

    if (!normalizedTitle) {
      return;
    }

    onCreateChecklist(normalizedTitle);
    setChecklistTitle("");
    setIsAddingChecklist(false);
  };

  return (
    <section aria-labelledby="card-checklists-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3
            className="flex items-center gap-2 text-sm font-semibold text-text"
            id="card-checklists-heading"
          >
            <CheckSquare2 aria-hidden="true" size={18} />
            Чек-листы
          </h3>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            Отмечайте выполненные пункты и меняйте их порядок.
          </p>
        </div>

        {!isAddingChecklist ? (
          <Button size="sm" variant="secondary" onClick={() => setIsAddingChecklist(true)}>
            <Plus aria-hidden="true" size={16} />
            Добавить
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {checklists.map((checklist) => (
          <ChecklistBlock
            key={checklist.id}
            checklist={checklist}
            checklistItems={checklistItems}
            onCreateItem={onCreateItem}
            onDeleteChecklist={(checklistId) => setChecklistIdToDelete(checklistId)}
            onDeleteItem={onDeleteItem}
            onMoveItem={onMoveItem}
            onRenameChecklist={onRenameChecklist}
            onRenameItem={onRenameItem}
            onToggleItem={onToggleItem}
          />
        ))}
      </div>

      {checklists.length === 0 && !isAddingChecklist ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-control/20 px-4 py-5 text-sm leading-6 text-text-muted">
          Чек-лист поможет разделить большую задачу на понятные шаги.
        </div>
      ) : null}

      {isAddingChecklist ? (
        <form
          className="rounded-2xl border border-white/10 bg-control/25 p-3"
          onSubmit={createChecklist}
        >
          <label className="sr-only" htmlFor="new-checklist-title">
            Название чек-листа
          </label>
          <input
            autoFocus
            id="new-checklist-title"
            className="h-10 w-full rounded-xl border border-white/10 bg-panel/55 px-3 text-sm text-text placeholder:text-text-muted"
            placeholder="Например, Перед публикацией"
            value={checklistTitle}
            onChange={(event) => setChecklistTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setChecklistTitle("");
                setIsAddingChecklist(false);
              }
            }}
          />
          <div className="mt-2 flex items-center gap-2">
            <Button disabled={!canCreateChecklist} size="sm" type="submit">
              Создать чек-лист
            </Button>
            <IconButton
              className="text-text-muted hover:bg-panel hover:text-text"
              label="Отменить создание чек-листа"
              size="sm"
              onClick={() => {
                setChecklistTitle("");
                setIsAddingChecklist(false);
              }}
            >
              <X aria-hidden="true" size={17} />
            </IconButton>
          </div>
        </form>
      ) : null}

      <ConfirmDialog
        confirmLabel="Удалить чек-лист"
        description={
          checklistToDelete
            ? `Чек-лист «${checklistToDelete.title}» и все его пункты будут удалены.`
            : "Чек-лист и все его пункты будут удалены."
        }
        destructive
        isOpen={Boolean(checklistToDelete)}
        title="Удалить чек-лист?"
        onCancel={() => setChecklistIdToDelete(null)}
        onConfirm={() => {
          if (checklistToDelete) {
            onDeleteChecklist(checklistToDelete.id);
          }

          setChecklistIdToDelete(null);
        }}
      />
    </section>
  );
}
