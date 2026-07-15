"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus, X } from "lucide-react";
import { type FormEvent, useState } from "react";

import type {
  Board,
  BoardCard,
  BoardList,
  CardDraft,
  ResolvedBoardAppearance,
} from "@/entities/board";
import { getCardMoveDestination } from "@/features/move-card";
import { getListMoveDestination } from "@/features/move-list";
import { getActiveBoardListIds } from "@/features/board-management";
import { cn, readDndItemData, type DndItemData } from "@/shared/lib";
import { Button, ConfirmDialog, FormHint, IconButton, TextField } from "@/shared/ui";

import { CardContextMenu } from "./CardContextMenu";
import { CardPreview } from "./CardItem";
import { ListColumn, ListPreview } from "./ListColumn";

type BoardColumnsProps = Readonly<{
  board: Board;
  appearance: ResolvedBoardAppearance;
  isFiltering?: boolean;
  visibleCardIdsByList?: Readonly<Record<string, readonly string[]>>;
  onAddCard: (listId: string, title: string) => void;
  onAddList: (title: string) => void;
  onRenameList: (listId: string, title: string) => void;
  onDeleteList: (listId: string) => void;
  onOpenListActions: (listId: string) => void;
  onOpenCard: (cardId: string) => void;
  onArchiveCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onDuplicateCard: (cardId: string) => void;
  onCreateChecklist: (cardId: string, title: string) => void;
  onSaveCard: (cardId: string, draft: CardDraft) => void;
  onMoveCard: (cardId: string, listId: string, index: number) => void;
  onMoveList: (listId: string, destinationListId: string) => void;
}>;

function getListCards(
  board: Board,
  list: BoardList,
  visibleCardIds?: readonly string[],
): BoardCard[] {
  const cardIds = visibleCardIds ?? list.cardIds;

  return cardIds
    .map((cardId) => board.cards[cardId])
    .filter((card): card is BoardCard => Boolean(card) && !card.isArchived);
}

export function BoardColumns({
  board,
  appearance,
  isFiltering = false,
  visibleCardIdsByList,
  onAddCard,
  onAddList,
  onRenameList,
  onDeleteList,
  onOpenListActions,
  onOpenCard,
  onArchiveCard,
  onDeleteCard,
  onDuplicateCard,
  onCreateChecklist,
  onSaveCard,
  onMoveCard,
  onMoveList,
}: BoardColumnsProps) {
  const [activeItem, setActiveItem] = useState<DndItemData | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    cardId: string;
    x: number;
    y: number;
  } | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [didAttemptEmptyListTitle, setDidAttemptEmptyListTitle] =
    useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const isDragEnabled = !isFiltering;
  const activeListIds = getActiveBoardListIds(board);

  const activeCard = activeItem?.cardId
    ? board.cards[activeItem.cardId]
    : undefined;
  const activeList = activeItem?.listId
    ? board.lists[activeItem.listId]
    : undefined;
  const contextCard = contextMenu ? board.cards[contextMenu.cardId] : undefined;
  const deleteCardTitle = deleteCardId ? board.cards[deleteCardId]?.title : undefined;
  const normalizedListTitle = listTitle.trim();
  const isListTitleWhitespaceOnly =
    listTitle.length > 0 && normalizedListTitle.length === 0;
  const canCreateList = normalizedListTitle.length > 0;

  const handleDragStart = (event: DragStartEvent) => {
    if (!isDragEnabled) {
      return;
    }

    setActiveItem(readDndItemData(event.active.data.current));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isDragEnabled) {
      setActiveItem(null);
      return;
    }

    const activeData = readDndItemData(event.active.data.current);
    const overData = readDndItemData(event.over?.data.current);

    setActiveItem(null);

    if (!event.over) {
      return;
    }

    const listDestination = getListMoveDestination(activeData, overData);

    if (listDestination) {
      onMoveList(listDestination.listId, listDestination.destinationListId);
      return;
    }

    const cardDestination = getCardMoveDestination(board, activeData, overData);

    if (cardDestination) {
      onMoveCard(
        cardDestination.cardId,
        cardDestination.destinationListId,
        cardDestination.destinationIndex,
      );
    }
  };

  const createList = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedListTitle) {
      setDidAttemptEmptyListTitle(true);
      return;
    }

    onAddList(normalizedListTitle);
    setListTitle("");
    setDidAttemptEmptyListTitle(false);
    setIsAddingList(false);
  };

  return (
    <DndContext
      autoScroll={isDragEnabled}
      collisionDetection={closestCorners}
      sensors={sensors}
      onDragCancel={() => setActiveItem(null)}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className=" h-full touch-pan-x overscroll-x-contain overflow-x-auto overflow-y-hidden px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6">
        <SortableContext
          items={activeListIds}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex h-full min-w-max items-start gap-3 pr-4 sm:pr-6">
            {activeListIds.map((listId) => {
              const list = board.lists[listId];

              if (!list) {
                return null;
              }

              const visibleCardIds = visibleCardIdsByList?.[list.id];
              const visibleList = visibleCardIds
                ? { ...list, cardIds: [...visibleCardIds] }
                : list;
              const cards = getListCards(board, list, visibleCardIds);

              return (
                <ListColumn
                  key={list.id}
                  cardSurface={appearance.cardSurface}
                  cards={cards}
                  checklistItems={board.checklistItems}
                  checklists={board.checklists}
                  labels={board.labels}
                  members={board.members}
                  attachments={board.attachments}
                  priorityOptions={board.cardPriorities}
                  priorityLabels={board.cardPriorityLabels}
                  statusOptions={board.cardStatuses}
                  statusLabels={board.cardStatusLabels}
                  isDragDisabled={!isDragEnabled}
                  list={visibleList}
                  totalCardCount={list.cardIds.length}
                  onAddCard={onAddCard}
                  onDeleteList={onDeleteList}
                  onOpenCardContextMenu={(cardId, x, y) =>
                    setContextMenu({ cardId, x, y })
                  }
                  onOpenListActions={onOpenListActions}
                  onOpenCard={onOpenCard}
                  onRenameList={onRenameList}
                />
              );
            })}

            {isAddingList ? (
              <form
                className="w-[min(86vw,19rem)] shrink-0 rounded-2xl border border-white/15 bg-slate-950/75 p-3 shadow-xl backdrop-blur-sm sm:w-80"
                onSubmit={createList}
              >
                <label className="sr-only" htmlFor="new-list-title">
                  Название нового списка
                </label>
                <TextField
                  autoFocus
                  id="new-list-title"
                  className="bg-white/5 text-white placeholder:text-slate-400"
                  placeholder="Например, На проверке"
                  value={listTitle}
                  onChange={(event) => {
                    setListTitle(event.target.value);
                    if (event.target.value.trim()) {
                      setDidAttemptEmptyListTitle(false);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setListTitle("");
                      setDidAttemptEmptyListTitle(false);
                      setIsAddingList(false);
                    }
                  }}
                />
                {didAttemptEmptyListTitle || isListTitleWhitespaceOnly ? (
                  <FormHint className="mt-2" tone="warning">
                    Список нельзя создать из одних пробелов. Напишите название.
                  </FormHint>
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  <Button disabled={!canCreateList} size="sm" type="submit">
                    Создать список
                  </Button>
                  <IconButton
                    className="text-slate-300 hover:bg-white/10 hover:text-white"
                    label="Отменить создание списка"
                    size="sm"
                    onClick={() => {
                      setListTitle("");
                      setDidAttemptEmptyListTitle(false);
                      setIsAddingList(false);
                    }}
                  >
                    <X aria-hidden="true" size={18} />
                  </IconButton>
                </div>
              </form>
            ) : (
              <button
                className={cn(
                  "flex h-12 w-[min(86vw,19rem)] shrink-0 items-center gap-2 rounded-2xl border border-dashed border-white/35 bg-slate-950/25 px-4 text-sm font-medium text-white/85 transition",
                  "hover:border-white/70 hover:bg-slate-950/45 hover:text-white sm:w-80",
                )}
                type="button"
                onClick={() => setIsAddingList(true)}
              >
                <Plus aria-hidden="true" size={18} />
                Добавить список
              </button>
            )}
          </div>
        </SortableContext>
      </div>

      {isDragEnabled ? (
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
          {activeCard ? (
            <CardPreview
              card={activeCard}
              cardSurface={appearance.cardSurface}
              checklistItems={board.checklistItems}
              checklists={board.checklists}
              labels={board.labels}
              members={board.members}
              attachments={board.attachments}
              priorityOptions={board.cardPriorities}
              priorityLabels={board.cardPriorityLabels}
              statusOptions={board.cardStatuses}
              statusLabels={board.cardStatusLabels}
            />
          ) : null}
          {activeList && activeItem?.type === "list" ? (
            <ListPreview list={activeList} />
          ) : null}
        </DragOverlay>
      ) : null}

      {contextMenu && contextCard ? (
        <CardContextMenu
          card={contextCard}
          checklistTemplates={board.checklistTemplates}
          coverColors={board.coverColors}
          customFieldTemplates={board.customFieldTemplates}
          labels={board.labels}
          priorityOptions={board.cardPriorities}
          priorityLabels={board.cardPriorityLabels}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          statusOptions={board.cardStatuses}
          statusLabels={board.cardStatusLabels}
          onArchive={(cardId) => {
            setContextMenu(null);
            onArchiveCard(cardId);
          }}
          onClose={() => setContextMenu(null)}
          onCreateChecklist={onCreateChecklist}
          onDelete={(cardId) => {
            setContextMenu(null);
            setDeleteCardId(cardId);
          }}
          onDuplicate={(cardId) => {
            setContextMenu(null);
            onDuplicateCard(cardId);
          }}
          onOpen={(cardId) => {
            setContextMenu(null);
            onOpenCard(cardId);
          }}
          onSave={onSaveCard}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Удалить карточку"
        description={
          deleteCardTitle
            ? `Карточка «${deleteCardTitle}» будет удалена без возможности восстановления.`
            : "Карточка будет удалена без возможности восстановления."
        }
        destructive
        isOpen={Boolean(deleteCardId)}
        title="Удалить карточку?"
        onCancel={() => setDeleteCardId(null)}
        onConfirm={() => {
          if (deleteCardId) {
            onDeleteCard(deleteCardId);
          }
          setDeleteCardId(null);
        }}
      />
    </DndContext>
  );
}
