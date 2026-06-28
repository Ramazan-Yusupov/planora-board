"use client";

import { ArchiveRestore, CalendarDays, ListChecks, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  getCardChecklistProgress,
  getCardLabels,
  type BoardCard,
  type BoardChecklist,
  type BoardChecklistItem,
  type BoardLabel,
  type BoardList,
} from "@/entities/board";
import { Button, ConfirmDialog, IconButton, Modal } from "@/shared/ui";

type CardArchiveModalProps = Readonly<{
  cards: readonly BoardCard[];
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  checklists: Readonly<Record<string, BoardChecklist>>;
  lists: Readonly<Record<string, BoardList>>;
  labels: Readonly<Record<string, BoardLabel>>;
  onClose: () => void;
  onDelete: (cardId: string) => void;
  onRestore: (cardId: string) => void;
  onRestoreList: (listId: string) => void;
}>;

function formatArchivedAt(timestamp: number | undefined): string {
  if (!timestamp) {
    return "Недавно";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function CardArchiveModal({
  cards,
  checklistItems,
  checklists,
  lists,
  labels,
  onClose,
  onDelete,
  onRestore,
  onRestoreList,
}: CardArchiveModalProps) {
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const archivedCards = useMemo(
    () =>
      cards
        .filter((card) => card.isArchived)
        .sort((first, second) => (second.archivedAt ?? 0) - (first.archivedAt ?? 0)),
    [cards],
  );
  const archivedLists = useMemo(
    () =>
      Object.values(lists)
        .filter((list) => list.isArchived)
        .sort((first, second) => (second.archivedAt ?? 0) - (first.archivedAt ?? 0)),
    [lists],
  );
  const cardToDelete = deleteCardId
    ? archivedCards.find((card) => card.id === deleteCardId) ?? null
    : null;

  return (
    <>
      <Modal title="Архив" onClose={onClose}>
        <div className="space-y-6">
        {archivedCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-control/30 px-5 py-10 text-center">
            <p className="text-sm font-medium text-text">Архив пока пуст</p>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Архивированные карточки можно будет восстановить отсюда.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-text-muted">
              Восстановленная карточка вернётся в свой прежний список в конце очереди.
            </p>

            <ul className="space-y-2" aria-label="Архивированные карточки">
              {archivedCards.map((card) => {
                const listTitle = lists[card.listId]?.title ?? "Удалённый список";
                const cardLabels = getCardLabels(card, labels).slice(0, 4);
                const checklistProgress = getCardChecklistProgress(
                  card,
                  checklists,
                  checklistItems,
                );

                return (
                  <li
                    key={card.id}
                    className="rounded-2xl border border-white/10 bg-control/30 p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start gap-2">
                          {card.sticker ? (
                            <span
                              aria-hidden="true"
                              className="mt-0.5 shrink-0 text-base leading-none"
                            >
                              {card.sticker}
                            </span>
                          ) : null}
                          <h3 className="break-words text-sm font-semibold text-text">
                            {card.title}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {listTitle} · архивирована {formatArchivedAt(card.archivedAt)}
                        </p>
                        {cardLabels.length > 0 ? (
                          <div className="mt-2 flex gap-1" aria-label="Метки карточки">
                            {cardLabels.map((label) => (
                              <span
                                key={label.id}
                                className="h-1.5 min-w-7 rounded-full"
                                style={{ backgroundColor: label.color }}
                                title={label.name}
                              />
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {card.dueDate ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-panel/70 px-2 py-1 text-[11px] font-medium text-text-muted">
                              <CalendarDays aria-hidden="true" size={13} />
                              Срок: {formatDueDate(card.dueDate)}
                            </span>
                          ) : null}
                          {checklistProgress.total > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-panel/70 px-2 py-1 text-[11px] font-medium text-text-muted">
                              <ListChecks aria-hidden="true" size={13} />
                              {checklistProgress.completed}/{checklistProgress.total}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onRestore(card.id)}
                        >
                          <ArchiveRestore aria-hidden="true" size={16} />
                          <span className="hidden sm:inline">Восстановить</span>
                        </Button>
                        <IconButton
                          className="text-text-muted hover:bg-red-500/15 hover:text-red-300"
                          label={`Удалить карточку «${card.title}» навсегда`}
                          size="sm"
                          onClick={() => setDeleteCardId(card.id)}
                        >
                          <Trash2 aria-hidden="true" size={16} />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <section className="border-t border-white/10 pt-5">
          <h3 className="text-sm font-semibold text-text">Архивированные списки</h3>
          {archivedLists.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">Архивированных списков пока нет.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {archivedLists.map((list) => (
                <li key={list.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-control/30 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text" title={list.title}>{list.title}</p>
                    <p className="mt-1 text-xs text-text-muted">{list.cardIds.length} задач · архивирован {formatArchivedAt(list.archivedAt)}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onRestoreList(list.id)}>
                    <ArchiveRestore aria-hidden="true" size={16} />
                    <span className="hidden sm:inline">Восстановить</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel="Удалить навсегда"
        description={
          cardToDelete
            ? `Карточка «${cardToDelete.title}» будет удалена без возможности восстановления.`
            : "Карточка будет удалена без возможности восстановления."
        }
        destructive
        isOpen={Boolean(cardToDelete)}
        title="Удалить карточку навсегда?"
        onCancel={() => setDeleteCardId(null)}
        onConfirm={() => {
          if (cardToDelete) {
            onDelete(cardToDelete.id);
          }

          setDeleteCardId(null);
        }}
      />
    </>
  );
}
