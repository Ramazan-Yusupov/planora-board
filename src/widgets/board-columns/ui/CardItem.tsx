"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical, ListChecks } from "lucide-react";
import type { CSSProperties } from "react";

import {
  getCardChecklistProgress,
  getCardLabels,
  type BoardCard,
  type BoardChecklist,
  type BoardChecklistItem,
  type BoardLabel,
  type CardSurface,
} from "@/entities/board";

type CardItemProps = Readonly<{
  card: BoardCard;
  cardSurface: CardSurface;
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  checklists: Readonly<Record<string, BoardChecklist>>;
  labels: Readonly<Record<string, BoardLabel>>;
  isDragDisabled?: boolean;
  onOpen: (cardId: string) => void;
}>;

type CardLabelsProps = Readonly<{
  card: BoardCard;
  labels: Readonly<Record<string, BoardLabel>>;
}>;

function CardLabels({ card, labels }: CardLabelsProps) {
  const cardLabels = getCardLabels(card, labels);
  const visibleLabels = cardLabels.slice(0, 4);
  const hiddenLabelsCount = Math.max(0, cardLabels.length - visibleLabels.length);

  if (visibleLabels.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 flex items-center gap-1" aria-label="Метки карточки">
      {visibleLabels.map((label) => (
        <span
          key={label.id}
          aria-label={label.name}
          className="h-1.5 min-w-7 rounded-full"
          style={{ backgroundColor: label.color }}
          title={label.name}
        />
      ))}
      {hiddenLabelsCount > 0 ? (
        <span className="text-[10px] font-medium text-current/70">+{hiddenLabelsCount}</span>
      ) : null}
    </div>
  );
}


type CardChecklistProgressProps = Readonly<{
  card: BoardCard;
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  checklists: Readonly<Record<string, BoardChecklist>>;
  mutedTextColor: string;
}>;

function CardChecklistProgress({
  card,
  checklistItems,
  checklists,
  mutedTextColor,
}: CardChecklistProgressProps) {
  const progress = getCardChecklistProgress(card, checklists, checklistItems);

  if (progress.total === 0) {
    return null;
  }

  return (
    <span
      className="mt-3 inline-flex items-center gap-1 rounded-md bg-black/10 px-2 py-1 text-[11px] font-medium"
      style={{ color: mutedTextColor }}
      title={`Чек-лист: ${progress.completed} из ${progress.total}`}
    >
      <ListChecks aria-hidden="true" size={13} />
      {progress.completed}/{progress.total}
    </span>
  );
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

function CardTitle({ card }: Readonly<{ card: BoardCard }>) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {card.sticker ? (
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-black/5 text-lg leading-none"
        >
          {card.sticker}
        </span>
      ) : null}
      <h3
        className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-current"
        title={card.title}
      >
        {card.title}
      </h3>
    </div>
  );
}

export function CardItem({
  card,
  cardSurface,
  checklistItems,
  checklists,
  labels,
  isDragDisabled = false,
  onOpen,
}: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    disabled: isDragDisabled,
    id: card.id,
    data: {
      type: "card",
      cardId: card.id,
      listId: card.listId,
    },
  });

  const style = createSurfaceStyle(
    CSS.Transform.toString(transform),
    transition,
    cardSurface,
  );

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
          <CardLabels card={card} labels={labels} />
          <CardTitle card={card} />
          {card.description ? (
            <p
              className="mt-1 line-clamp-2 text-xs leading-5"
              style={{ color: cardSurface.mutedTextColor }}
            >
              {card.description}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {card.dueDate ? (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
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
            <CardChecklistProgress
              card={card}
              checklistItems={checklistItems}
              checklists={checklists}
              mutedTextColor={cardSurface.mutedTextColor}
            />
          </div>
        </button>
      </div>
    </article>
  );
}

export function CardPreview({
  card,
  cardSurface,
  checklistItems,
  checklists,
  labels,
}: Readonly<{
  card: BoardCard;
  cardSurface: CardSurface;
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  checklists: Readonly<Record<string, BoardChecklist>>;
  labels: Readonly<Record<string, BoardLabel>>;
}>) {
  return (
    <article
      className="w-72 rotate-1 rounded-xl border p-3 shadow-xl"
      style={{
        backgroundColor: cardSurface.backgroundColor,
        borderColor: cardSurface.borderColor,
        color: cardSurface.textColor,
      }}
    >
      <CardLabels card={card} labels={labels} />
      <CardTitle card={card} />
      <CardChecklistProgress
        card={card}
        checklistItems={checklistItems}
        checklists={checklists}
        mutedTextColor={cardSurface.mutedTextColor}
      />
    </article>
  );
}
