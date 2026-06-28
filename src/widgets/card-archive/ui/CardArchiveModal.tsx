"use client";

import { ArchiveRestore, CalendarDays, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { type BoardCard, type BoardList } from "@/entities/board";
import { Button, ConfirmDialog, IconButton, Modal } from "@/shared/ui";

type CardArchiveModalProps = Readonly<{
  cards: readonly BoardCard[];
  lists: Readonly<Record<string, BoardList>>;
  onClose: () => void;
  onDelete: (cardId: string) => void;
  onRestore: (cardId: string) => void;
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
  lists,
  onClose,
  onDelete,
  onRestore,
}: CardArchiveModalProps) {
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const archivedCards = useMemo(
    () =>
      cards
        .filter((card) => card.isArchived)
        .sort((first, second) => (second.archivedAt ?? 0) - (first.archivedAt ?? 0)),
    [cards],
  );
  const cardToDelete = deleteCardId
    ? archivedCards.find((card) => card.id === deleteCardId) ?? null
    : null;

  return (
    <>
      <Modal title="Архив карточек" onClose={onClose}>
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

                return (
                  <li
                    key={card.id}
                    className="rounded-2xl border border-white/10 bg-control/30 p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-semibold text-text">
                          {card.title}
                        </h3>
                        <p className="mt-1 text-xs text-text-muted">
                          {listTitle} · архивирована {formatArchivedAt(card.archivedAt)}
                        </p>
                        {card.dueDate ? (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-panel/70 px-2 py-1 text-[11px] font-medium text-text-muted">
                            <CalendarDays aria-hidden="true" size={13} />
                            Срок: {formatDueDate(card.dueDate)}
                          </span>
                        ) : null}
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
