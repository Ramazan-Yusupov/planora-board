"use client";

import {
  AlignLeft,
  CalendarDays,
  Flag,
  ListChecks,
  MessageSquare,
  Paperclip,
  Rows3,
} from "lucide-react";

import {
  CARD_PRIORITY_OPTIONS,
  CARD_STATUS_OPTIONS,
  getCardChecklistProgress,
  type BoardCardOption,
  type BoardCard,
  type BoardChecklist,
  type BoardChecklistItem,
  type BoardMember,
  type CardPriority,
  type CardSurface,
  type CardStatus,
} from "@/entities/board";
import { cn } from "@/shared/lib";

type CardBadgesProps = Readonly<{
  card: BoardCard;
  cardSurface: CardSurface;
  priorityOptions?: readonly BoardCardOption[];
  priorityLabels?: Partial<Record<CardPriority, string>>;
  statusOptions?: readonly BoardCardOption[];
  statusLabels?: Partial<Record<CardStatus, string>>;
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  checklists: Readonly<Record<string, BoardChecklist>>;
  members: Readonly<Record<string, BoardMember>>;
}>;

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toLocaleUpperCase("ru-RU") ?? "").join("");
}

function getDueDateStatus(dueDate: string): "overdue" | "today" | "upcoming" {
  const today = new Date();
  const todayKey = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const [year = 0, month = 1, day = 1] = dueDate.split("-").map(Number);
  const dueKey = new Date(year, month - 1, day).getTime();

  if (dueKey < todayKey) {
    return "overdue";
  }

  if (dueKey === todayKey) {
    return "today";
  }

  return "upcoming";
}

function formatCardDueDate(dueDate: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${dueDate}T12:00:00`));
}

type BadgeOption = Readonly<{
  value: string;
  label: string;
  color: string;
}>;

function getOptionMeta(
  options: readonly BadgeOption[],
  value: string,
): BadgeOption {
  return (
    options.find((option) => option.value === value) ?? {
      value,
      label: value,
      color: "#64748b",
    }
  );
}

function CardChecklistProgress({
  card,
  checklistItems,
  checklists,
  mutedTextColor,
}: CardBadgesProps & Readonly<{ mutedTextColor: string }>) {
  const progress = getCardChecklistProgress(card, checklists, checklistItems);

  if (progress.total === 0) {
    return null;
  }

  return (
    <span
      className="inline-flex min-h-7 items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-medium tabular-nums"
      style={{ color: mutedTextColor }}
      title={`Чек-лист: ${progress.completed} из ${progress.total}`}
    >
      <ListChecks aria-hidden="true" size={13} />
      {progress.completed}/{progress.total}
    </span>
  );
}

export function CardBadges({
  card,
  cardSurface,
  priorityOptions = [],
  priorityLabels = {},
  statusOptions = [],
  statusLabels = {},
  checklistItems,
  checklists,
  members,
}: CardBadgesProps) {
  const hasDescription = card.description.trim().length > 0;
  const hasAttachments = card.attachmentIds.length > 0;
  const hasChecklist = card.checklistIds.length > 0;
  const hasComments = card.commentIds.length > 0;
  const hasCustomFields = card.customFields.length > 0;
  const allStatusOptions: BadgeOption[] = [
    ...CARD_STATUS_OPTIONS.map((option) => ({
      value: option.value,
      label: statusLabels[option.value] ?? option.label,
      color: option.color,
    })),
    ...statusOptions.map((option) => ({
      value: option.id,
      label: option.name,
      color: option.color,
    })),
  ];
  const allPriorityOptions: BadgeOption[] = [
    ...CARD_PRIORITY_OPTIONS.map((option) => ({
      value: option.value,
      label: priorityLabels[option.value] ?? option.label,
      color: option.color,
    })),
    ...priorityOptions.map((option) => ({
      value: option.id,
      label: option.name,
      color: option.color,
    })),
  ];
  const status = getOptionMeta(allStatusOptions, card.status);
  const priority = getOptionMeta(allPriorityOptions, card.priority);
  const statusLabel = status.label;
  const priorityLabel = priority.label;
  const cardMembers = card.memberIds.flatMap((memberId) => {
    const member = members[memberId];
    return member ? [member] : [];
  });
  const visibleMembers = cardMembers.slice(0, 3);
  const hiddenMembersCount = Math.max(0, cardMembers.length - visibleMembers.length);
  const dueDateStatus = card.dueDate ? getDueDateStatus(card.dueDate) : null;

  if (
    !card.dueDate &&
    !card.startDate &&
    !hasDescription &&
    !hasAttachments &&
    !hasChecklist &&
    !hasComments &&
    !hasCustomFields &&
    card.status === "none" &&
    card.priority === "none" &&
    cardMembers.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {card.status !== "none" ? (
        <span
          className="inline-flex min-h-7 max-w-full min-w-0 items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-semibold"
          style={{ color: status.color }}
          title={`Статус: ${statusLabel}`}
        >
          <Rows3 aria-hidden="true" className="shrink-0" size={13} />
          <span className="min-w-0 max-w-32 truncate">{statusLabel}</span>
        </span>
      ) : null}

      {card.priority !== "none" ? (
        <span
          className="inline-flex min-h-7 max-w-full min-w-0 items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-semibold"
          style={{ color: priority.color }}
          title={`Приоритет: ${priorityLabel}`}
        >
          <Flag aria-hidden="true" className="shrink-0" size={13} />
          <span className="min-w-0 max-w-32 truncate">{priorityLabel}</span>
        </span>
      ) : null}

      {card.startDate ? (
        <span
          className="inline-flex min-h-7 items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-medium tabular-nums"
          style={{ color: cardSurface.mutedTextColor }}
          title={`Старт: ${formatCardDueDate(card.startDate)}`}
        >
          <CalendarDays aria-hidden="true" size={13} />
          {formatCardDueDate(card.startDate)}
        </span>
      ) : null}

      {card.dueDate ? (
        <span
          className={cn(
            "inline-flex min-h-7 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums",
            dueDateStatus === "overdue" &&
              "border-red-300/40 bg-red-500/18 text-red-100",
            dueDateStatus === "today" &&
              "border-amber-200/45 bg-amber-400/20 text-amber-50",
            dueDateStatus === "upcoming" && "border-black/5",
          )}
          style={
            dueDateStatus === "upcoming"
              ? {
                  backgroundColor: cardSurface.chipBackgroundColor,
                  color: cardSurface.textColor,
                }
              : undefined
          }
          title={
            dueDateStatus === "overdue"
              ? `Просрочено: ${formatCardDueDate(card.dueDate)}`
              : dueDateStatus === "today"
                ? `Сегодня: ${formatCardDueDate(card.dueDate)}`
                : `Срок: ${formatCardDueDate(card.dueDate)}`
          }
        >
          <CalendarDays aria-hidden="true" size={13} />
          {formatCardDueDate(card.dueDate)}
        </span>
      ) : null}

      {hasDescription ? (
        <span
          className="inline-flex min-h-7 items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-medium"
          style={{ color: cardSurface.mutedTextColor }}
          title="Есть описание"
        >
          <AlignLeft aria-hidden="true" size={13} />
        </span>
      ) : null}

      {hasAttachments ? (
        <span
          className="inline-flex min-h-7 items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-medium tabular-nums"
          style={{ color: cardSurface.mutedTextColor }}
          title={`Вложений: ${card.attachmentIds.length}`}
        >
          <Paperclip aria-hidden="true" size={13} />
          {card.attachmentIds.length}
        </span>
      ) : null}

      {hasComments ? (
        <span
          className="inline-flex min-h-7 items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-medium tabular-nums"
          style={{ color: cardSurface.mutedTextColor }}
          title={`Комментариев: ${card.commentIds.length}`}
        >
          <MessageSquare aria-hidden="true" size={13} />
          {card.commentIds.length}
        </span>
      ) : null}

      {hasCustomFields ? (
        <span
          className="inline-flex min-h-7 items-center gap-1 rounded-md border border-black/5 bg-black/10 px-2 py-1 text-[11px] font-medium tabular-nums"
          style={{ color: cardSurface.mutedTextColor }}
          title={`Дополнительных полей: ${card.customFields.length}`}
        >
          <Rows3 aria-hidden="true" size={13} />
          {card.customFields.length}
        </span>
      ) : null}

      <CardChecklistProgress
        card={card}
        cardSurface={cardSurface}
        checklistItems={checklistItems}
        checklists={checklists}
        members={members}
        mutedTextColor={cardSurface.mutedTextColor}
      />

      {visibleMembers.length > 0 ? (
        <span className="ml-auto flex min-h-7 items-center -space-x-1">
          {visibleMembers.map((member) => (
            <span
              key={member.id}
              className="grid size-7 place-items-center rounded-full border border-black/10 text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: member.avatarColor }}
              title={member.name}
            >
              {getInitials(member.name)}
            </span>
          ))}
          {hiddenMembersCount > 0 ? (
            <span className="grid size-7 place-items-center rounded-full border border-black/10 bg-black/25 text-[10px] font-bold text-white shadow-sm">
              +{hiddenMembersCount}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
