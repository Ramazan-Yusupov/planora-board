"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "./Button";
import { Modal } from "./Modal";

type ConfirmDialogProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Отмена",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      role="alertdialog"
      title={title}
      zIndexClassName="z-80"
      onClose={onCancel}
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${
              destructive
                ? "bg-red-500/15 text-red-300"
                : "bg-accent/15 text-accent"
            }`}
          >
            <AlertTriangle aria-hidden="true" size={20} />
          </span>
          <p className="pt-1 text-sm leading-6 text-text-muted">{description}</p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button autoFocus variant={destructive ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
