"use client";

import { CalendarDays, FileText, Tag, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { LABEL_OPTIONS, type BoardCard, type CardDraft } from "@/entities/board";
import { Modal } from "@/shared/ui";

type CardModalProps = Readonly<{
  card: BoardCard;
  listTitle: string;
  onClose: () => void;
  onDelete: (cardId: string) => void;
  onSave: (cardId: string, draft: CardDraft) => void;
}>;

function createDraft(card: BoardCard): CardDraft {
  return {
    title: card.title,
    description: card.description,
    dueDate: card.dueDate,
    label: card.label,
  };
}

export function CardModal({ card, listTitle, onClose, onDelete, onSave }: CardModalProps) {
  const [draft, setDraft] = useState<CardDraft>(() => createDraft(card));
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const dueDateId = useId();
  const labelId = useId();

  const save = () => {
    if (!draft.title.trim()) {
      return;
    }

    onSave(card.id, draft);
    onClose();
  };

  return (
    <Modal title="Редактирование карточки" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">Список: {listTitle}</p>
          <label className="mt-2 block text-sm font-medium text-text" htmlFor={titleId}>
            Название
          </label>
          <input
            autoFocus
            id={titleId}
            className="mt-2 h-11 w-full rounded-xl border bg-panel px-3 text-sm text-text placeholder:text-text-muted"
            placeholder="Напишите понятное название задачи"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                save();
              }
            }}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-text" htmlFor={descriptionId}>
            <FileText aria-hidden="true" size={17} />
            Описание
          </label>
          <textarea
            id={descriptionId}
            className="mt-2 min-h-32 w-full resize-y rounded-xl border bg-panel px-3 py-2.5 text-sm leading-6 text-text placeholder:text-text-muted"
            placeholder="Добавьте детали, критерии готовности или ссылки"
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text" htmlFor={dueDateId}>
              <CalendarDays aria-hidden="true" size={17} />
              Срок
            </label>
            <input
              id={dueDateId}
              className="mt-2 h-11 w-full rounded-xl border bg-panel px-3 text-sm text-text"
              type="date"
              value={draft.dueDate ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value || undefined }))}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text" htmlFor={labelId}>
              <Tag aria-hidden="true" size={17} />
              Метка
            </label>
            <select
              id={labelId}
              className="mt-2 h-11 w-full rounded-xl border bg-panel px-3 text-sm text-text"
              value={draft.label}
              onChange={(event) => {
                const option = LABEL_OPTIONS.find((item) => item.value === event.target.value);
                if (option) {
                  setDraft((current) => ({ ...current, label: option.value }));
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

        <div className="flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row sm:items-center">
          {showDeleteConfirmation ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-danger">Удалить без возможности восстановления?</span>
              <button
                className="h-10 rounded-xl bg-danger px-3 text-sm font-medium text-white transition hover:bg-danger-hover"
                type="button"
                onClick={() => {
                  onDelete(card.id);
                  onClose();
                }}
              >
                Да, удалить
              </button>
              <button
                className="h-10 rounded-xl px-3 text-sm font-medium text-text-muted transition hover:bg-control hover:text-text"
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-danger transition hover:bg-red-50"
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <Trash2 aria-hidden="true" size={17} />
              Удалить карточку
            </button>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              className="h-10 rounded-xl px-4 text-sm font-medium text-text-muted transition hover:bg-control hover:text-text"
              type="button"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              className="h-10 rounded-xl bg-accent px-4 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!draft.title.trim()}
              type="button"
              onClick={save}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
