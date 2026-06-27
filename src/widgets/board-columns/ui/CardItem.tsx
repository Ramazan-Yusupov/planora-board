"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical } from "lucide-react";

import { LABEL_OPTIONS, type BoardCard } from "@/entities/board";

type CardItemProps = Readonly<{
  card: BoardCard;
  onOpen: (cardId: string) => void;
}>;

function getLabel(card: BoardCard) {
  return LABEL_OPTIONS.find((option) => option.value === card.label);
}

export function CardItem({ card, onOpen }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: {
      type: "card",
      cardId: card.id,
      listId: card.listId,
    },
  });

  const label = getLabel(card);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border bg-panel p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isDragging ? "opacity-35" : "opacity-100"
      }`}
    >
      <div className="flex gap-2">
        <button
          aria-label={`Переместить карточку: ${card.title}`}
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-text-muted opacity-70 transition hover:bg-control hover:text-text focus:opacity-100 group-hover:opacity-100"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" size={17} />
        </button>

        <button
          className="min-w-0 flex-1 text-left"
          type="button"
          onClick={() => onOpen(card.id)}
        >
          {label && label.value !== "none" ? (
            <span className={`mb-2 block h-1.5 w-11 rounded-full ${label.color}`} />
          ) : null}
          <h3 className="break-words text-sm font-medium leading-5 text-text">{card.title}</h3>
          {card.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">{card.description}</p>
          ) : null}
          {card.dueDate ? (
            <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-control px-2 py-1 text-[11px] font-medium text-text-muted">
              <CalendarDays aria-hidden="true" size={13} />
              {new Intl.DateTimeFormat("ru-RU", {
                day: "2-digit",
                month: "short",
              }).format(new Date(`${card.dueDate}T12:00:00`))}
            </span>
          ) : null}
        </button>
      </div>
    </article>
  );
}

export function CardPreview({ card }: Readonly<{ card: BoardCard }>) {
  const label = getLabel(card);

  return (
    <article className="w-72 rotate-1 rounded-xl border bg-panel p-3 shadow-xl">
      {label && label.value !== "none" ? (
        <span className={`mb-2 block h-1.5 w-11 rounded-full ${label.color}`} />
      ) : null}
      <h3 className="text-sm font-medium leading-5 text-text">{card.title}</h3>
    </article>
  );
}
