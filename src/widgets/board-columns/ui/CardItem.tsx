"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical } from "lucide-react";
import type { CSSProperties } from "react";

import { LABEL_OPTIONS, type BoardCard, type CardSurface } from "@/entities/board";

type CardItemProps = Readonly<{
  card: BoardCard;
  cardSurface: CardSurface;
  isDragDisabled?: boolean;
  onOpen: (cardId: string) => void;
}>;

function getLabel(card: BoardCard) {
  return LABEL_OPTIONS.find((option) => option.value === card.label);
}

function createSurfaceStyle(
  transform: ReturnType<typeof CSS.Transform.toString>,
  transition: string | undefined,
  cardSurface: CardSurface,
): CSSProperties {
  return {
    transform,
    transition,
    backgroundColor: cardSurface.backgroundColor,
    borderColor: cardSurface.borderColor,
    color: cardSurface.textColor,
  };
}

export function CardItem({
  card,
  cardSurface,
  isDragDisabled = false,
  onOpen,
}: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    disabled: isDragDisabled,
    id: card.id,
    data: {
      type: "card",
      cardId: card.id,
      listId: card.listId,
    },
  });

  const label = getLabel(card);
  const style = createSurfaceStyle(CSS.Transform.toString(transform), transition, cardSurface);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isDragging ? "opacity-35" : "opacity-100"
      }`}
    >
      <div className="flex gap-2">
        <button
          aria-label={`Переместить карточку: ${card.title}`}
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg opacity-70 transition hover:bg-black/10 focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-35"
          disabled={isDragDisabled}
          style={{ color: cardSurface.mutedTextColor }}
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
          <h3 className="break-words text-sm font-medium leading-5 text-current">{card.title}</h3>
          {card.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: cardSurface.mutedTextColor }}>
              {card.description}
            </p>
          ) : null}
          {card.dueDate ? (
            <span
              className="mt-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
              style={{
                backgroundColor: cardSurface.chipBackgroundColor,
                color: cardSurface.textColor,
              }}
            >
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

export function CardPreview({ card, cardSurface }: Readonly<{ card: BoardCard; cardSurface: CardSurface }>) {
  const label = getLabel(card);

  return (
    <article
      className="w-72 rotate-1 rounded-xl border p-3 shadow-xl"
      style={{
        backgroundColor: cardSurface.backgroundColor,
        borderColor: cardSurface.borderColor,
        color: cardSurface.textColor,
      }}
    >
      {label && label.value !== "none" ? (
        <span className={`mb-2 block h-1.5 w-11 rounded-full ${label.color}`} />
      ) : null}
      <h3 className="text-sm font-medium leading-5 text-current">{card.title}</h3>
    </article>
  );
}
