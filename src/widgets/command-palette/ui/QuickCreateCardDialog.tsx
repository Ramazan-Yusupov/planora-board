"use client";

import { useId, useState } from "react";

import type { BoardList } from "@/entities/board";
import { Button, Modal, Select, TextField } from "@/shared/ui";

type QuickCreateCardDialogProps = Readonly<{
  isOpen: boolean;
  lists: readonly BoardList[];
  onClose: () => void;
  onCreate: (listId: string, title: string) => void;
}>;

export function QuickCreateCardDialog({
  isOpen,
  lists,
  onClose,
  onCreate,
}: QuickCreateCardDialogProps) {
  const titleId = useId();
  const listId = useId();
  const [title, setTitle] = useState("");
  const [selectedListId, setSelectedListId] = useState(lists[0]?.id ?? "");

  if (!isOpen) {
    return null;
  }

  const create = () => {
    const normalizedTitle = title.trim();

    if (!normalizedTitle || !selectedListId) {
      return;
    }

    onCreate(selectedListId, normalizedTitle);
    setTitle("");
    onClose();
  };

  return (
    <Modal title="Новая карточка" zIndexClassName="z-[84]" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text" htmlFor={titleId}>Название</label>
          <TextField
            autoFocus
            id={titleId}
            className="mt-2"
            placeholder="Например, подготовить макеты"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                create();
              }
            }}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text" htmlFor={listId}>Список</label>
          <Select id={listId} className="mt-2" value={selectedListId} onChange={(event) => setSelectedListId(event.target.value)}>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>{list.title}</option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button disabled={!title.trim() || !selectedListId} onClick={create}>Создать</Button>
        </div>
      </div>
    </Modal>
  );
}
