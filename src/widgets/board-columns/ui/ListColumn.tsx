"use client";

import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";

import type { BoardCard, BoardList } from "@/entities/board";

import { CardItem } from "./CardItem";

type ListColumnProps = Readonly<{
  list: BoardList;
  cards: BoardCard[];
  onOpenCard: (cardId: string) => void;
  onAddCard: (listId: string, title: string) => void;
  onRenameList: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
}>;

export function ListColumn({
  list,
  cards,
  onOpenCard,
  onAddCard,
  onRenameList,
  onDeleteList,
}: ListColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [listTitle, setListTitle] = useState(list.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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
    if (listTitle.trim()) {
      onRenameList(list.id, listTitle);
      return;
    }

    setListTitle(list.title);
  };

  const requestDelete = () => {
    const confirmationText = cards.length
      ? `Удалить список «${list.title}» и ${cards.length} карточек?`
      : `Удалить список «${list.title}»?`;

    if (window.confirm(confirmationText)) {
      onDeleteList(list.id);
    }
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`flex h-fit max-h-[calc(100dvh-11rem)] w-[min(86vw,19rem)] shrink-0 flex-col rounded-2xl border bg-surface-muted p-2 shadow-sm sm:w-80 ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <header className="flex items-center gap-1 px-1 pb-2">
        <button
          aria-label={`Переместить список: ${list.title}`}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-control hover:text-text"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" size={18} />
        </button>

        <input
          aria-label="Название списка"
          className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm font-semibold text-text outline-none transition focus:bg-panel"
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

        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-panel text-xs font-semibold text-text-muted">
          {cards.length}
        </span>
        <button
          aria-label={`Удалить список ${list.title}`}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-red-50 hover:text-danger"
          type="button"
          onClick={requestDelete}
        >
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </header>

      <div
        ref={setDropRef}
        className={`min-h-20 space-y-2 overflow-y-auto rounded-xl p-1 transition ${
          isOver ? "bg-accent/10 ring-1 ring-accent/30" : ""
        }`}
      >
        {cards.map((card) => (
          <CardItem key={card.id} card={card} onOpen={onOpenCard} />
        ))}

        {cards.length === 0 ? (
          <p className="grid min-h-20 place-items-center rounded-xl border border-dashed bg-panel/45 px-3 text-center text-xs leading-5 text-text-muted">
            Перетащите сюда карточку или создайте новую.
          </p>
        ) : null}
      </div>

      {isAddingCard ? (
        <form className="mt-2 rounded-xl border bg-panel p-2" onSubmit={saveCard}>
          <label className="sr-only" htmlFor={`new-card-${list.id}`}>
            Название новой карточки
          </label>
          <textarea
            autoFocus
            id={`new-card-${list.id}`}
            className="min-h-20 w-full resize-none rounded-lg border bg-panel px-3 py-2 text-sm text-text placeholder:text-text-muted"
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
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover"
              type="submit"
            >
              <Check aria-hidden="true" size={16} />
              Создать
            </button>
            <button
              aria-label="Отменить создание карточки"
              className="grid size-9 place-items-center rounded-lg text-text-muted transition hover:bg-control hover:text-text"
              type="button"
              onClick={() => {
                setCardTitle("");
                setIsAddingCard(false);
              }}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        </form>
      ) : (
        <button
          className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-text-muted transition hover:bg-control hover:text-text"
          type="button"
          onClick={() => setIsAddingCard(true)}
        >
          <Plus aria-hidden="true" size={17} />
          Добавить карточку
        </button>
      )}
    </section>
  );
}

export function ListPreview({ list }: Readonly<{ list: BoardList }>) {
  return (
    <section className="w-80 rotate-1 rounded-2xl border bg-surface-muted p-3 shadow-xl">
      <div className="flex items-center gap-2">
        <GripVertical aria-hidden="true" size={18} className="text-text-muted" />
        <p className="font-semibold text-text">{list.title}</p>
      </div>
    </section>
  );
}
