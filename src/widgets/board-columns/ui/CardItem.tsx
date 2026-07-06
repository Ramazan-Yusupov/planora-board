"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical, ListChecks } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

import {
  getCardChecklistProgress,
  getCardLabels,
  loadAttachmentBlob,
  type BoardAttachment,
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
  attachments: Readonly<Record<string, BoardAttachment>>;
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
  const hiddenLabelsCount = Math.max(
    0,
    cardLabels.length - visibleLabels.length,
  );

  if (visibleLabels.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 flex items-center gap-1.5" aria-label="Метки карточки">
      {visibleLabels.map((label) => (
        <span
          key={label.id}
          aria-label={label.name}
          className="h-1.5 min-w-7 rounded-full shadow-[0_1px_2px_rgb(0_0_0_/_20%)]"
          style={{ backgroundColor: label.color }}
          title={label.name}
        />
      ))}
      {hiddenLabelsCount > 0 ? (
        <span className="text-[10px] font-medium text-current/70">
          +{hiddenLabelsCount}
        </span>
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
      className="mt-3 inline-flex items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-medium"
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

function AttachmentCardCover({
  attachment,
}: Readonly<{ attachment: BoardAttachment }>) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let disposed = false;

    void loadAttachmentBlob(attachment.id).then((blob) => {
      if (!blob || disposed) {
        return;
      }

      objectUrl = URL.createObjectURL(blob);
      setSource(objectUrl);
    });

    return () => {
      disposed = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachment.id]);

  if (!source) {
    return (
      <div aria-hidden="true" className="mb-3 h-20 rounded-xl bg-black/10" />
    );
  }

  // Blob URLs from IndexedDB are not handled by Next Image optimisation.

  return (
    <img
      alt=""
      className="mb-3 h-20 w-full rounded-xl object-cover ring-1 ring-black/10"
      src={source}
    />
  );
}

function CardCover({
  card,
  attachments,
}: Readonly<{
  card: BoardCard;
  attachments: Readonly<Record<string, BoardAttachment>>;
}>) {
  if (!card.cover) {
    return null;
  }

  if (card.cover.type === "color") {
    return (
      <div
        aria-hidden="true"
        className="mb-3 h-10 rounded-xl shadow-[inset_0_1px_0_rgb(255_255_255_/_18%)]"
        style={{ backgroundColor: card.cover.color }}
      />
    );
  }

  const attachment = attachments[card.cover.attachmentId];

  return attachment ? <AttachmentCardCover attachment={attachment} /> : null;
}

function CardTitle({ card }: Readonly<{ card: BoardCard }>) {
  return (
    <div className="flex min-h-7 min-w-0 items-center gap-2">
      {card.sticker ? (
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-black/5 text-lg leading-none shadow-[inset_0_1px_0_rgb(255_255_255_/_10%)]"
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
  attachments,
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
      className={`group touch-manipulation rounded-xl border p-3 shadow-[0_2px_4px_rgb(0_0_0_/_7%)] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(0_0_0_/_14%)] ${
        isDragging ? "opacity-35" : "opacity-100"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          aria-label={`Переместить карточку: ${card.title}`}
          className="drag-handle grid size-11 shrink-0 touch-none select-none place-items-center rounded-xl opacity-70 [-webkit-touch-callout:none] transition hover:bg-black/10 focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-35 sm:size-7 sm:rounded-lg"
          disabled={isDragDisabled}
          style={{ color: cardSurface.mutedTextColor }}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" size={17} />
        </button>

        <button
          className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/25"
          type="button"
          onClick={() => onOpen(card.id)}
        >
          <CardCover card={card} attachments={attachments} />
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
                className="inline-flex items-center gap-1 rounded-md border border-black/5 px-2 py-1 text-[11px] font-medium"
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
  attachments,
}: Readonly<{
  card: BoardCard;
  cardSurface: CardSurface;
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  checklists: Readonly<Record<string, BoardChecklist>>;
  labels: Readonly<Record<string, BoardLabel>>;
  attachments: Readonly<Record<string, BoardAttachment>>;
}>) {
  return (
    <article
      className="w-72 rotate-1 rounded-xl border p-3 shadow-float"
      style={{
        backgroundColor: cardSurface.backgroundColor,
        borderColor: cardSurface.borderColor,
        color: cardSurface.textColor,
      }}
    >
      <CardCover card={card} attachments={attachments} />
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
