"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
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
  BoardChecklist,
  BoardChecklistItem,
  BoardLabel,
  BoardList,
  CardSurface,
} from "@/entities/board";
import { cn } from "@/shared/lib";
import {
  Button,
  ConfirmDialog,
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
  attachments: Readonly<Record<string, BoardAttachment>>;
  isDragDisabled: boolean;
  totalCardCount: number;
  onOpenCard: (cardId: string) => void;
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
  attachments,
  isDragDisabled,
  totalCardCount,
  onOpenCard,
  onAddCard,
  onRenameList,
  onDeleteList,
  onOpenListActions,
}: ListColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [listTitle, setListTitle] = useState(list.title);
  const [isEditingListTitle, setIsEditingListTitle] = useState(false);
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
      return;
    }

    onAddCard(list.id, normalizedTitle);
    setCardTitle("");
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

  return (
    <Fragment>
      <section
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex h-fit max-h-[calc(100dvh-12.25rem)] w-[min(90vw,21rem)] shrink-0 flex-col rounded-2xl border border-white/10 bg-slate-950/52 p-2.5 shadow-[0_16px_38px_rgb(0_0_0_/_24%),inset_0_1px_0_rgb(255_255_255_/_3%)] backdrop-blur-xl sm:w-80",
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
            className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/8 text-xs font-semibold text-slate-100 shadow-[inset_0_1px_0_rgb(255_255_255_/_3%)]"
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

        <SortableContext
          items={list.cardIds}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setDropRef}
            className={cn(
              "scrollbar-none min-h-20 touch-pan-y overscroll-contain space-y-2 overflow-y-auto rounded-xl p-1 transition-[background-color,box-shadow] duration-150",
              isOver ? "bg-white/8 ring-1 ring-accent/45 shadow-[inset_0_0_0_1px_rgb(59_130_246_/_10%)]" : "",
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
                attachments={attachments}
                isDragDisabled={isDragDisabled}
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

        {isAddingCard ? (
          <form
            className="mt-2 rounded-xl border border-white/10 bg-slate-950/70 p-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_3%)]"
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
              onChange={(event) => setCardTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setCardTitle("");
                  setIsAddingCard(false);
                }
              }}
            />
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" type="submit">
                <Check aria-hidden="true" size={16} />
                Создать
              </Button>
              <IconButton
                className="text-slate-300 hover:bg-white/10 hover:text-white"
                label="Отменить создание карточки"
                size="sm"
                onClick={() => {
                  setCardTitle("");
                  setIsAddingCard(false);
                }}
              >
                <X aria-hidden="true" size={18} />
              </IconButton>
            </div>
          </form>
        ) : (
          <button
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
        )}
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
