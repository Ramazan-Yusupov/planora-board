"use client";

import {
  Archive,
  CalendarDays,
  Copy,
  FileText,
  MoveRight,
  Tag,
  Trash2,
} from "lucide-react";
import { useId, useState } from "react";

import {
  LABEL_OPTIONS,
  type BoardCard,
  type CardDraft,
} from "@/entities/board";
import { CardStickerPicker } from "@/features/manage-card-sticker";
import { Button, ConfirmDialog, Modal } from "@/shared/ui";

type CardListOption = Readonly<{
  id: string;
  title: string;
}>;

type CardModalProps = Readonly<{
  card: BoardCard;
  lists: readonly CardListOption[];
  listTitle: string;
  onArchive: (cardId: string) => void;
  onClose: () => void;
  onDelete: (cardId: string) => void;
  onDuplicate: (cardId: string) => void;
  onMove: (cardId: string, destinationListId: string) => void;
  onSave: (cardId: string, draft: CardDraft) => void;
}>;

function createDraft(card: BoardCard): CardDraft {
  return {
    title: card.title,
    description: card.description,
    dueDate: card.dueDate,
    label: card.label,
    sticker: card.sticker,
  };
}

export function CardModal({
  card,
  lists,
  listTitle,
  onArchive,
  onClose,
  onDelete,
  onDuplicate,
  onMove,
  onSave,
}: CardModalProps) {
  const [draft, setDraft] = useState<CardDraft>(() => createDraft(card));
  const [destinationListId, setDestinationListId] = useState(card.listId);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const dueDateId = useId();
  const labelId = useId();
  const destinationListIdInput = useId();

  const saveDraft = (): boolean => {
    if (!draft.title.trim()) {
      return false;
    }

    onSave(card.id, draft);
    return true;
  };

  const save = () => {
    if (saveDraft()) {
      onClose();
    }
  };

  const moveToSelectedList = () => {
    if (destinationListId === card.listId || !saveDraft()) {
      return;
    }

    onMove(card.id, destinationListId);
    onClose();
  };

  const duplicate = () => {
    if (saveDraft()) {
      onDuplicate(card.id);
    }
  };

  const archive = () => {
    if (saveDraft()) {
      onArchive(card.id);
      onClose();
    }
  };

  return (
    <>
      <Modal title="Редактирование карточки" onClose={onClose}>
        <div className="space-y-5">
          <CardStickerPicker
            sticker={draft.sticker}
            onChange={(sticker) =>
              setDraft((current) => ({
                ...current,
                sticker,
              }))
            }
          />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
              Список: {listTitle}
            </p>
            <label
              className="mt-2 block text-sm font-medium text-text"
              htmlFor={titleId}
            >
              Название
            </label>
            <input
              autoFocus
              id={titleId}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text placeholder:text-text-muted"
              placeholder="Напишите понятное название задачи"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  save();
                }
              }}
            />
          </div>

          <div>
            <label
              className="flex items-center gap-2 text-sm font-medium text-text"
              htmlFor={descriptionId}
            >
              <FileText aria-hidden="true" size={17} />
              Описание
            </label>
            <textarea
              id={descriptionId}
              className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/10 bg-control/45 px-3 py-2.5 text-sm leading-6 text-text placeholder:text-text-muted"
              placeholder="Добавьте детали, критерии готовности или ссылки"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium text-text"
                htmlFor={dueDateId}
              >
                <CalendarDays aria-hidden="true" size={17} />
                Срок
              </label>
              <input
                id={dueDateId}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text"
                type="date"
                value={draft.dueDate ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    dueDate: event.target.value || undefined,
                  }))
                }
              />
            </div>

            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium text-text"
                htmlFor={labelId}
              >
                <Tag aria-hidden="true" size={17} />
                Метка
              </label>
              <select
                id={labelId}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text"
                value={draft.label}
                onChange={(event) => {
                  const option = LABEL_OPTIONS.find(
                    (item) => item.value === event.target.value,
                  );

                  if (option) {
                    setDraft((current) => ({
                      ...current,
                      label: option.value,
                    }));
                  }
                }}
              >
                {LABEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="rounded-2xl border border-white/10 bg-control/25 p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-text">Действия</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Перед действием текущие изменения карточки будут сохранены.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label
                  className="sr-only"
                  htmlFor={destinationListIdInput}
                >
                  Список для перемещения карточки
                </label>
                <select
                  id={destinationListIdInput}
                  className="h-10 w-full rounded-xl border border-white/10 bg-panel/70 px-3 text-sm text-text"
                  value={destinationListId}
                  onChange={(event) => setDestinationListId(event.target.value)}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                disabled={destinationListId === card.listId}
                size="md"
                variant="secondary"
                onClick={moveToSelectedList}
              >
                <MoveRight aria-hidden="true" size={17} />
                Переместить
              </Button>
            </div>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Button className="sm:flex-1" variant="secondary" onClick={duplicate}>
                <Copy aria-hidden="true" size={17} />
                Создать копию
              </Button>
              <Button className="sm:flex-1" variant="dangerGhost" onClick={archive}>
                <Archive aria-hidden="true" size={17} />
                Архивировать
              </Button>
            </div>
          </section>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
            <Button
              className="justify-center sm:justify-start"
              variant="dangerGhost"
              onClick={() => setIsDeleteConfirmationOpen(true)}
            >
              <Trash2 aria-hidden="true" size={17} />
              Удалить карточку
            </Button>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Отмена
              </Button>
              <Button disabled={!draft.title.trim()} onClick={save}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel="Удалить карточку"
        description={`Карточка «${card.title}» будет удалена без возможности восстановления.`}
        destructive
        isOpen={isDeleteConfirmationOpen}
        title="Удалить карточку?"
        onCancel={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={() => {
          onDelete(card.id);
          onClose();
        }}
      />
    </>
  );
}
