"use client";

import { Archive, Copy, MoveRight, Trash2 } from "lucide-react";
import { useState } from "react";

import type { BoardList } from "@/entities/board";
import { Button, ConfirmDialog, Modal, Panel, Select, TextField } from "@/shared/ui";

type ListActionsDialogProps = Readonly<{
  list: BoardList | null;
  availableLists: readonly BoardList[];
  onArchive: (listId: string) => void;
  onClear: (listId: string) => void;
  onClose: () => void;
  onDuplicate: (listId: string) => void;
  onMoveAll: (listId: string, destinationListId: string) => void;
  onSetWipLimit: (listId: string, limit: number | undefined) => void;
}>;

export function ListActionsDialog({
  list,
  availableLists,
  onArchive,
  onClear,
  onClose,
  onDuplicate,
  onMoveAll,
  onSetWipLimit,
}: ListActionsDialogProps) {
  const [destinationListId, setDestinationListId] = useState("");
  const [wipDraft, setWipDraft] = useState(list?.wipLimit?.toString() ?? "");
  const [confirmation, setConfirmation] = useState<"archive" | "clear" | null>(null);

  if (!list) {
    return null;
  }

  const destinationLists = availableLists.filter((candidate) => candidate.id !== list.id);
  const hasCards = list.cardIds.length > 0;

  const saveWipLimit = () => {
    const normalized = wipDraft.trim();
    const numericLimit = normalized ? Number(normalized) : undefined;

    if (
      numericLimit !== undefined &&
      (!Number.isFinite(numericLimit) || numericLimit <= 0)
    ) {
      return;
    }

    onSetWipLimit(list.id, numericLimit);
  };

  return (
    <>
      <Modal title={`Настройки: ${list.title}`} onClose={onClose}>
        <div className="space-y-4">
          <Panel>
            <h3 className="text-sm font-semibold text-text">Лимит задач</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Ограничивает создание и перенос карточек в этот список.
            </p>
            <div className="mt-3 flex gap-2">
              <TextField
                className="max-w-36"
                inputMode="numeric"
                min={1}
                placeholder="Без лимита"
                type="number"
                value={wipDraft}
                onChange={(event) => setWipDraft(event.target.value)}
              />
              <Button variant="secondary" onClick={saveWipLimit}>
                Сохранить
              </Button>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-sm font-semibold text-text">Карточки списка</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Перенесите все карточки или удалите их окончательно.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Select
                disabled={destinationLists.length === 0 || !hasCards}
                value={destinationListId}
                onChange={(event) => setDestinationListId(event.target.value)}
              >
                <option value="">Выберите список</option>
                {destinationLists.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </option>
                ))}
              </Select>
              <Button
                disabled={!destinationListId || !hasCards}
                variant="secondary"
                onClick={() => {
                  onMoveAll(list.id, destinationListId);
                  onClose();
                }}
              >
                <MoveRight aria-hidden="true" size={17} />
                Переместить все
              </Button>
            </div>
            <Button
              className="mt-2"
              disabled={!hasCards}
              variant="dangerGhost"
              onClick={() => setConfirmation("clear")}
            >
              <Trash2 aria-hidden="true" size={17} />
              Очистить список
            </Button>
          </Panel>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              onClick={() => {
                onDuplicate(list.id);
                onClose();
              }}
            >
              <Copy aria-hidden="true" size={17} />
              Создать копию
            </Button>
            <Button variant="dangerGhost" onClick={() => setConfirmation("archive")}>
              <Archive aria-hidden="true" size={17} />
              Архивировать список
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel={confirmation === "clear" ? "Очистить" : "Архивировать"}
        description={
          confirmation === "clear"
            ? `Все карточки списка «${list.title}» будут удалены без возможности восстановления.`
            : `Список «${list.title}» и его карточки будут скрыты с доски. Их можно будет восстановить из архива.`
        }
        destructive={confirmation === "clear"}
        isOpen={confirmation !== null}
        title={confirmation === "clear" ? "Очистить список?" : "Архивировать список?"}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation === "clear") {
            onClear(list.id);
          } else {
            onArchive(list.id);
          }
          setConfirmation(null);
          onClose();
        }}
      />
    </>
  );
}
