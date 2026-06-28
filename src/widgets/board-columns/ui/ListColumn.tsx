"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Fragment, type FormEvent, useState } from "react";

import type { BoardCard, BoardList, CardSurface } from "@/entities/board";
import { cn } from "@/shared/lib";
import { Button, ConfirmDialog, IconButton } from "@/shared/ui";

import { CardItem } from "./CardItem";

type ListColumnProps = Readonly<{
  list: BoardList;
  cards: BoardCard[];
  cardSurface: CardSurface;
  onOpenCard: (cardId: string) => void;
  onAddCard: (listId: string, title: string) => void;
  onRenameList: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
}>;

export function ListColumn({
  list,
  cards,
  cardSurface,
  onOpenCard,
  onAddCard,
  onRenameList,
  onDeleteList,
}: ListColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [listTitle, setListTitle] = useState(list.title);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: list.id,
      data: {
        type: "list",
        listId: list.id,
      },
    });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
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
      return;
    }

    setListTitle(list.title);
  };

  const deleteDescription = cards.length
    ? `Список «${list.title}» и ${cards.length} карточек будут удалены без возможности восстановления.`
    : `Список «${list.title}» будет удалён без возможности восстановления.`;

  return (
    <Fragment>
      <section
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex h-fit max-h-[calc(100dvh-12.5rem)] w-[min(86vw,19rem)] shrink-0 flex-col rounded-2xl border border-white/10 bg-slate-950/45 p-2 shadow-xl backdrop-blur-sm sm:w-80",
          isDragging ? "opacity-40" : "opacity-100",
        )}
      >
        <header className="flex items-center gap-1 px-1 pb-2">
          <IconButton
            {...attributes}
            {...listeners}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
            label={`Переместить список: ${list.title}`}
            size="sm"
          >
            <GripVertical aria-hidden="true" size={18} />
          </IconButton>

          <input
            aria-label="Название списка"
            className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-400 focus:bg-white/10"
            value={listTitle}
            onBlur={saveListTitle}
            onChange={(event) => setListTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }

              if (event.key === "Escape") {
                setListTitle(list.title);
                event.currentTarget.blur();
              }
            }}
          />

          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-semibold text-slate-200">
            {cards.length}
          </span>
          <IconButton
            className="text-slate-300 hover:bg-red-500/15 hover:text-red-200"
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
              "min-h-20 space-y-2 overflow-y-auto rounded-xl p-1 transition",
              isOver ? "bg-white/10 ring-1 ring-white/30" : "",
            )}
          >
            {cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                cardSurface={cardSurface}
                onOpen={onOpenCard}
              />
            ))}

            {cards.length === 0 ? (
              <p className="grid min-h-20 place-items-center rounded-xl border border-dashed border-white/20 bg-black/10 px-3 text-center text-xs leading-5 text-slate-300">
                Перетащите сюда карточку или создайте новую.
              </p>
            ) : null}
          </div>
        </SortableContext>

        {isAddingCard ? (
          <form
            className="mt-2 rounded-xl border border-white/10 bg-slate-950/60 p-2"
            onSubmit={saveCard}
          >
            <label className="sr-only" htmlFor={`new-card-${list.id}`}>
              Название новой карточки
            </label>
            <textarea
              autoFocus
              id={`new-card-${list.id}`}
              className="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400"
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
            className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
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
        <p className="font-semibold text-white">{list.title}</p>
      </div>
    </section>
  );
}
