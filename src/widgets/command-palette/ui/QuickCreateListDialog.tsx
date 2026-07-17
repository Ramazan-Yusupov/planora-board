"use client";

import { useId, useState } from "react";

import { Button, Modal, TextField } from "@/shared/ui";

type QuickCreateListDialogProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}>;

export function QuickCreateListDialog({
  isOpen,
  onClose,
  onCreate,
}: QuickCreateListDialogProps) {
  const titleId = useId();
  const [title, setTitle] = useState("");

  if (!isOpen) {
    return null;
  }

  const create = () => {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      return;
    }

    onCreate(normalizedTitle);
    setTitle("");
    onClose();
  };

  return (
    <Modal title="Новый список" zIndexClassName="z-84" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text" htmlFor={titleId}>
            Название
          </label>
          <TextField
            autoFocus
            id={titleId}
            className="mt-2"
            placeholder="Например, На проверке"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                create();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setTitle("");
                onClose();
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setTitle("");
              onClose();
            }}
          >
            Отмена
          </Button>
          <Button disabled={!title.trim()} onClick={create}>
            Создать
          </Button>
        </div>
      </div>
    </Modal>
  );
}
