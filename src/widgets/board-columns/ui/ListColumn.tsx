"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Check,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Fragment, type FormEvent, useState } from "react";

import type {
  BoardAttachment,
  BoardCard,
  BoardCardOption,
  BoardChecklist,
  BoardChecklistItem,
  BoardLabel,
  BoardList,
  BoardMember,
  CardPriority,
  CardSurface,
  CardStatus,
} from "@/entities/board";
import { cn } from "@/shared/lib";
import {
  Button,
  ConfirmDialog,
  FormHint,
  IconButton,
  Textarea,
  TextField,
} from "@/shared/ui";

import { CardItem } from "./CardItem";

type ListColumnProps = Readonly<{
  list: BoardList;
  cards: BoardCard[];
  cardSurface: CardSurface;
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  checklists: Readonly<Record<string, BoardChecklist>>;
  labels: Readonly<Record<string, BoardLabel>>;
  members: Readonly<Record<string, BoardMember>>;
  attachments: Readonly<Record<string, BoardAttachment>>;
  priorityOptions: readonly BoardCardOption[];
  priorityLabels: Partial<Record<CardPriority, string>>;
  statusOptions: readonly BoardCardOption[];
  statusLabels: Partial<Record<CardStatus, string>>;
  isDragDisabled: boolean;
  totalCardCount: number;
  onOpenCard: (cardId: string) => void;
  onOpenCardContextMenu: (cardId: string, x: number, y: number) => void;
  onAddCard: (listId: string, title: string) => void;
  onRenameList: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  onOpenListActions: (listId: string) => void;
}>;

export function ListColumn({
  list,
  cards,
  cardSurface,
  checklistItems,
  checklists,
  labels,
  members,
  attachments,
  priorityOptions,
  priorityLabels,
  statusOptions,
  statusLabels,
  isDragDisabled,
  totalCardCount,
  onOpenCard,
  onOpenCardContextMenu,
  onAddCard,
  onRenameList,
  onDeleteList,
  onOpenListActions,
}: ListColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [didAttemptEmptyCardTitle, setDidAttemptEmptyCardTitle] =
    useState(false);
  const [listTitle, setListTitle] = useState(list.title);
  const [isEditingListTitle, setIsEditingListTitle] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    disabled: isDragDisabled,
    id: list.id,
    data: {
      type: "list",
      listId: list.id,
    },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    disabled: isDragDisabled,
    id: `list-drop-${list.id}`,
    data: {
      type: "list-drop",
      listId: list.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const saveCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = cardTitle.trim();

    if (!normalizedTitle) {
      setDidAttemptEmptyCardTitle(true);
      return;
    }

    onAddCard(list.id, normalizedTitle);
    setCardTitle("");
    setDidAttemptEmptyCardTitle(false);
    setIsAddingCard(false);
  };

  const saveListTitle = () => {
    const normalizedTitle = listTitle.trim();

    if (normalizedTitle) {
      onRenameList(list.id, normalizedTitle);
    } else {
      setListTitle(list.title);
    }

    setIsEditingListTitle(false);
  };

  const deleteDescription = totalCardCount
    ? `Список «${list.title}» и ${totalCardCount} карточек будут удалены без возможности восстановления.`
    : `Список «${list.title}» будет удалён без возможности восстановления.`;
  const emptyMessage = isDragDisabled
    ? "Нет карточек по текущему фильтру."
    : "Перетащите сюда карточку или создайте новую.";
  const completedCardCount = cards.filter(
    (card) => card.status === "done",
  ).length;
  const completionPercent = totalCardCount
    ? Math.round((completedCardCount / totalCardCount) * 100)
    : 0;
  const wipPercent = list.wipLimit
    ? Math.min(100, Math.round((totalCardCount / list.wipLimit) * 100))
    : 0;
  const normalizedCardTitle = cardTitle.trim();
  const isCardTitleWhitespaceOnly =
    cardTitle.length > 0 && normalizedCardTitle.length === 0;
  const canCreateCard = normalizedCardTitle.length > 0;

  return (
    <Fragment>
      <section
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex h-fit max-h-[calc(100dvh-12.25rem)] w-[min(90vw,21rem)] shrink-0 flex-col rounded-2xl border border-white/10 bg-slate-950/52 p-2.5 shadow-[0_16px_38px_rgb(0_0_0/24%),inset_0_1px_0_rgb(255_255_255/3%)] backdrop-blur-xl sm:w-80",
          isDragging ? "opacity-40" : "opacity-100",
        )}
      >
        <header className="flex min-w-0 items-center gap-1 px-1 pb-2.5">
          <IconButton
            {...attributes}
            {...listeners}
            className="drag-handle size-11 touch-none select-none text-slate-300 [-webkit-touch-callout:none] hover:bg-white/10 hover:text-white sm:size-8"
            disabled={isDragDisabled}
            label={`Переместить список: ${list.title}`}
            size="sm"
          >
            <GripVertical aria-hidden="true" size={18} />
          </IconButton>

          <IconButton
            aria-pressed={isCollapsed}
            className="size-10 text-slate-300 hover:bg-white/10 hover:text-white sm:size-8"
            label={
              isCollapsed
                ? `Развернуть список ${list.title}`
                : `Свернуть список ${list.title}`
            }
            size="sm"
            onClick={() => setIsCollapsed((current) => !current)}
          >
            {isCollapsed ? (
              <ChevronRight aria-hidden="true" size={17} />
            ) : (
              <ChevronDown aria-hidden="true" size={17} />
            )}
          </IconButton>

          {isEditingListTitle ? (
            <TextField
              aria-label="Название списка"
              autoFocus
              className="h-auto min-w-0 flex-1 rounded-lg border-0 bg-white/10 px-2 py-1.5 text-sm font-semibold text-white placeholder:text-slate-400 focus:border-0"
              value={listTitle}
              onBlur={saveListTitle}
              onChange={(event) => setListTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }

                if (event.key === "Escape") {
                  setListTitle(list.title);
                  setIsEditingListTitle(false);
                }
              }}
            />
          ) : (
            <button
              className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-white transition hover:bg-white/10 focus:bg-white/10"
              title={list.title}
              type="button"
              onClick={() => setIsEditingListTitle(true)}
            >
              {list.title}
            </button>
          )}

          <span
            className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/8 text-xs font-semibold tabular-nums text-slate-100 shadow-[inset_0_1px_0_rgb(255_255_255/3%)]"
            title={
              list.wipLimit
                ? `${totalCardCount} из ${list.wipLimit}`
                : `${totalCardCount} задач`
            }
          >
            {list.wipLimit
              ? `${totalCardCount}/${list.wipLimit}`
              : totalCardCount}
          </span>
          <IconButton
            className="size-10 text-slate-300 hover:bg-white/10 hover:text-white sm:size-8"
            label={`Действия со списком ${list.title}`}
            size="sm"
            onClick={() => onOpenListActions(list.id)}
          >
            <MoreHorizontal aria-hidden="true" size={17} />
          </IconButton>
          <IconButton
            className="size-10 text-slate-300 hover:bg-red-500/15 hover:text-red-200 sm:size-8"
            label={`Удалить список ${list.title}`}
            size="sm"
            onClick={() => setIsDeleteConfirmationOpen(true)}
          >
            <Trash2 aria-hidden="true" size={16} />
          </IconButton>
        </header>

        <div className="mb-2 grid gap-1.5 rounded-xl border border-white/8 bg-white/6 px-2.5 py-2">
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-300">
            <span>
              Готово: {completedCardCount}/{totalCardCount}
            </span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {list.wipLimit ? (
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/20">
              <div
                className={cn(
                  "h-full rounded-full",
                  totalCardCount >= list.wipLimit
                    ? "bg-amber-300"
                    : "bg-sky-400",
                )}
                style={{ width: `${wipPercent}%` }}
              />
            </div>
          ) : null}
        </div>

        {isCollapsed ? (
          <button
            className="grid min-h-20 place-items-center rounded-xl border border-dashed border-white/16 bg-black/10 px-3 text-center text-xs font-medium leading-5 text-slate-300 transition hover:bg-white/8 hover:text-white"
            type="button"
            onClick={() => setIsCollapsed(false)}
          >
            {totalCardCount} карточек скрыто
          </button>
        ) : (
          <SortableContext
            items={list.cardIds}
            strategy={verticalListSortingStrategy}
          >
            <div
              ref={setDropRef}
              className={cn(
                "scrollbar-none min-h-20 touch-pan-y overscroll-contain space-y-2 overflow-y-auto rounded-xl p-1 transition-[background-color,box-shadow] duration-150",
                isOver
                  ? "bg-white/8 ring-1 ring-accent/45 shadow-[inset_0_0_0_1px_rgb(59_130_246/10%)]"
                  : "",
              )}
            >
              {cards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  cardSurface={cardSurface}
                  checklistItems={checklistItems}
                  checklists={checklists}
                  labels={labels}
                  members={members}
                  attachments={attachments}
                  priorityOptions={priorityOptions}
                  priorityLabels={priorityLabels}
                  statusOptions={statusOptions}
                  statusLabels={statusLabels}
                  isDragDisabled={isDragDisabled}
                  onContextMenu={onOpenCardContextMenu}
                  onOpen={onOpenCard}
                />
              ))}

              {cards.length === 0 ? (
                <p className="grid min-h-20 place-items-center rounded-xl border border-dashed border-white/20 bg-black/10 px-3 text-center text-xs leading-5 text-slate-300">
                  {emptyMessage}
                </p>
              ) : null}
            </div>
          </SortableContext>
        )}

        {!isCollapsed && isAddingCard ? (
          <form
            aria-label={`Создание карточки в списке ${list.title}`}
            className="mt-2 rounded-xl border border-white/10 bg-slate-950/70 p-2 shadow-[inset_0_1px_0_rgb(255_255_255/3%)]"
            onSubmit={saveCard}
          >
            <label className="sr-only" htmlFor={`new-card-${list.id}`}>
              Название новой карточки
            </label>
            <Textarea
              autoFocus
              id={`new-card-${list.id}`}
              className="min-h-20 resize-none rounded-lg bg-white/5 text-white placeholder:text-slate-400"
              placeholder="Например, подготовить макеты"
              value={cardTitle}
              onChange={(event) => {
                setCardTitle(event.target.value);
                if (event.target.value.trim()) {
                  setDidAttemptEmptyCardTitle(false);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setCardTitle("");
                  setDidAttemptEmptyCardTitle(false);
                  setIsAddingCard(false);
                }
              }}
            />
            {didAttemptEmptyCardTitle || isCardTitleWhitespaceOnly ? (
              <FormHint className="mt-2" tone="warning">
                Карточку нельзя создать из одних пробелов. Напишите название.
              </FormHint>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              <Button disabled={!canCreateCard} size="sm" type="submit">
                <Check aria-hidden="true" size={16} />
                Создать
              </Button>
              <IconButton
                className="text-slate-300 hover:bg-white/10 hover:text-white"
                label="Отменить создание карточки"
                size="sm"
                onClick={() => {
                  setCardTitle("");
                  setDidAttemptEmptyCardTitle(false);
                  setIsAddingCard(false);
                }}
              >
                <X aria-hidden="true" size={18} />
              </IconButton>
            </div>
          </form>
        ) : !isCollapsed ? (
          <button
            aria-label={`Добавить карточку в список ${list.title}`}
            className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-300 transition-[background-color,color,transform] hover:bg-white/10 hover:text-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
            disabled={Boolean(list.wipLimit && totalCardCount >= list.wipLimit)}
            title={
              list.wipLimit && totalCardCount >= list.wipLimit
                ? `Лимит списка: ${list.wipLimit}`
                : undefined
            }
            type="button"
            onClick={() => setIsAddingCard(true)}
          >
            <Plus aria-hidden="true" size={17} />
            Добавить карточку
          </button>
        ) : null}
      </section>

      <ConfirmDialog
        confirmLabel="Удалить список"
        description={deleteDescription}
        destructive
        isOpen={isDeleteConfirmationOpen}
        title="Удалить список?"
        onCancel={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmationOpen(false);
          onDeleteList(list.id);
        }}
      />
    </Fragment>
  );
}

export function ListPreview({ list }: Readonly<{ list: BoardList }>) {
  return (
    <section className="w-80 rotate-1 rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <GripVertical aria-hidden="true" className="text-slate-300" size={18} />
        <p
          className="min-w-0 flex-1 truncate font-semibold text-white"
          title={list.title}
        >
          {list.title}
        </p>
      </div>
    </section>
  );
}
