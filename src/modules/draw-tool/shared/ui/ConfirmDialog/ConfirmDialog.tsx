import { Button } from "../Button/Button";
import { Modal } from "../Modal/Modal";

type ConfirmDialogProps = {
  confirmLabel: string;
  description: string;
  isOpen: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  confirmLabel,
  description,
  isOpen,
  title,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="m-0 text-sm leading-6 text-text-muted">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button
          className="rounded-lg bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
          onClick={onCancel}
          type="button"
        >
          Отмена
        </Button>
        <Button
          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-400"
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

