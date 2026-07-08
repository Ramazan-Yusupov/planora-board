"use client";

import {
  Archive,
  CalendarDays,
  Copy,
  FileText,
  MoveRight,
  Trash2,
} from "lucide-react";
import { useId, useState } from "react";

import type {
  BoardAttachment,
  BoardCard,
  BoardChecklist,
  BoardChecklistItem,
  BoardComment,
  BoardLabel,
  BoardLabelDraft,
  BoardList,
  BoardMember,
  BoardMemberDraft,
  CardDraft,
} from "@/entities/board";
import { CardMembersEditor } from "@/features/manage-card-members";
import { CardStickerPicker } from "@/features/manage-card-sticker";
import { CardAttachmentsEditor } from "@/features/manage-attachments";
import { CardChecklistsEditor } from "@/features/manage-checklist";
import { CardCommentsEditor } from "@/features/manage-comments";
import { CardLabelsEditor } from "@/features/manage-labels";
import { Button, ConfirmDialog, FieldLabel, Modal, Panel, Select, Textarea, TextField } from "@/shared/ui";

type CardModalProps = Readonly<{
  card: BoardCard;
  attachments: readonly BoardAttachment[];
  checklists: readonly BoardChecklist[];
  checklistItems: Readonly<Record<string, BoardChecklistItem>>;
  comments: readonly BoardComment[];
  labels: readonly BoardLabel[];
  lists: readonly BoardList[];
  listTitle: string;
  members: readonly BoardMember[];
  onAddAttachment: (attachment: BoardAttachment) => void;
  onCreateComment: (cardId: string, message: string) => void;
  onArchive: (cardId: string) => void;
  onClose: () => void;
  onCreateChecklist: (cardId: string, title: string) => void;
  onCreateChecklistItem: (checklistId: string, title: string) => void;
  onCreateLabel: (draft: BoardLabelDraft) => BoardLabel | null;
  onCreateMember: (draft: BoardMemberDraft) => BoardMember | null;
  onDelete: (cardId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onDeleteChecklistItem: (itemId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteLabel: (labelId: string) => void;
  onDeleteMember: (memberId: string) => void;
  onDuplicate: (cardId: string) => void;
  onMove: (cardId: string, destinationListId: string) => void;
  onMoveChecklistItem: (itemId: string, destinationIndex: number) => void;
  onRenameChecklist: (checklistId: string, title: string) => void;
  onRenameChecklistItem: (itemId: string, title: string) => void;
  onSave: (cardId: string, draft: CardDraft) => void;
  onToggleChecklistItem: (itemId: string) => void;
  onToggleMember: (cardId: string, memberId: string) => void;
  onUpdateComment: (commentId: string, message: string) => void;
  onUpdateLabel: (labelId: string, draft: BoardLabelDraft) => void;
  onUpdateMember: (memberId: string, draft: BoardMemberDraft) => void;
}>;

function createDraft(card: BoardCard): CardDraft {
  return {
    title: card.title,
    description: card.description,
    dueDate: card.dueDate,
    labelIds: [...card.labelIds],
    sticker: card.sticker,
    cover: card.cover,
  };
}

export function CardModal({
  card,
  attachments,
  checklists,
  checklistItems,
  comments,
  labels,
  lists,
  listTitle,
  members,
  onAddAttachment,
  onCreateComment,
  onArchive,
  onClose,
  onCreateChecklist,
  onCreateChecklistItem,
  onCreateLabel,
  onCreateMember,
  onDelete,
  onDeleteAttachment,
  onDeleteChecklist,
  onDeleteChecklistItem,
  onDeleteComment,
  onDeleteLabel,
  onDeleteMember,
  onDuplicate,
  onMove,
  onMoveChecklistItem,
  onRenameChecklist,
  onRenameChecklistItem,
  onSave,
  onToggleChecklistItem,
  onToggleMember,
  onUpdateComment,
  onUpdateLabel,
  onUpdateMember,
}: CardModalProps) {
  const [draft, setDraft] = useState<CardDraft>(() => createDraft(card));
  const [destinationListId, setDestinationListId] = useState(card.listId);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const dueDateId = useId();
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
            onChange={(sticker) => setDraft((current) => ({ ...current, sticker }))}
          />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">Список: {listTitle}</p>
            <FieldLabel className="mt-2" htmlFor={titleId}>Название</FieldLabel>
            <TextField
              autoFocus
              id={titleId}
              className="mt-2"
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
            <FieldLabel htmlFor={descriptionId}>
              <FileText aria-hidden="true" size={17} />
              Описание
            </FieldLabel>
            <Textarea
              id={descriptionId}
              className="mt-2 min-h-32"
              placeholder="Добавьте детали, критерии готовности или ссылки"
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            />
          </div>

          <div>
            <FieldLabel htmlFor={dueDateId}>
              <CalendarDays aria-hidden="true" size={17} />
              Срок
            </FieldLabel>
            <TextField
              id={dueDateId}
              className="mt-2"
              type="date"
              value={draft.dueDate ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value || undefined }))}
            />
          </div>

          <CardLabelsEditor
            labels={labels}
            selectedLabelIds={draft.labelIds}
            onChange={(labelIds) => setDraft((current) => ({ ...current, labelIds }))}
            onCreateLabel={onCreateLabel}
            onDeleteLabel={(labelId) => {
              onDeleteLabel(labelId);
              setDraft((current) => ({
                ...current,
                labelIds: current.labelIds.filter((currentLabelId) => currentLabelId !== labelId),
              }));
            }}
            onUpdateLabel={onUpdateLabel}
          />

          <CardMembersEditor
            members={members}
            selectedMemberIds={card.memberIds}
            onCreateMember={onCreateMember}
            onDeleteMember={onDeleteMember}
            onToggleMember={(memberId) => onToggleMember(card.id, memberId)}
            onUpdateMember={onUpdateMember}
          />

          <CardChecklistsEditor
            checklists={checklists}
            checklistItems={checklistItems}
            onCreateChecklist={(title) => onCreateChecklist(card.id, title)}
            onCreateItem={onCreateChecklistItem}
            onDeleteChecklist={onDeleteChecklist}
            onDeleteItem={onDeleteChecklistItem}
            onMoveItem={onMoveChecklistItem}
            onRenameChecklist={onRenameChecklist}
            onRenameItem={onRenameChecklistItem}
            onToggleItem={onToggleChecklistItem}
          />

          <CardAttachmentsEditor
            attachments={attachments}
            cardId={card.id}
            cover={draft.cover}
            onAddAttachment={onAddAttachment}
            onChangeCover={(cover) => setDraft((current) => ({ ...current, cover }))}
            onDeleteAttachment={onDeleteAttachment}
          />

          <CardCommentsEditor
            comments={comments}
            onCreateComment={(message) => onCreateComment(card.id, message)}
            onDeleteComment={onDeleteComment}
            onUpdateComment={onUpdateComment}
          />

          <Panel>
            <h3 className="text-sm font-semibold text-text">Действия</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">Перед действием текущие изменения карточки будут сохранены.</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label className="sr-only" htmlFor={destinationListIdInput}>Список для перемещения карточки</label>
                <Select
                  id={destinationListIdInput}
                  value={destinationListId}
                  onChange={(event) => setDestinationListId(event.target.value)}
                >
                  {lists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}
                </Select>
              </div>
              <Button disabled={destinationListId === card.listId} variant="secondary" onClick={moveToSelectedList}>
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
          </Panel>

          <div className="flex flex-col-reverse justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
            <Button className="justify-center sm:justify-start" variant="dangerGhost" onClick={() => setIsDeleteConfirmationOpen(true)}>
              <Trash2 aria-hidden="true" size={17} />
              Удалить карточку
            </Button>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>Отмена</Button>
              <Button disabled={!draft.title.trim()} onClick={save}>Сохранить</Button>
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
