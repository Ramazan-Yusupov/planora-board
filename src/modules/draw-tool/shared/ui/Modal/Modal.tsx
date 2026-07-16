import { useEffect } from "react";
import type { ReactNode } from "react";
import { IconButton } from "../IconButton/IconButton";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  title: string;
  onClose: () => void;
};

export function Modal({ children, isOpen, title, onClose }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/64 p-4 backdrop-blur-md max-sm:items-end max-sm:p-2"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-label={title}
        aria-modal="true"
        className="drawtool-surface-in max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-border/90 bg-surface p-5 text-text shadow-float max-sm:max-h-[82dvh] max-sm:rounded-t-3xl max-sm:p-4"
        role="dialog"
      >
        <header className="mb-5 flex items-center justify-between gap-4 border-b border-border/70 pb-4">
          <h2 className="m-0 text-base font-semibold tracking-[-0.01em]">{title}</h2>

          <IconButton
            aria-label="Закрыть окно"
            className="grid size-9 place-items-center rounded-xl text-text-muted hover:bg-surface-muted hover:text-text"
            onClick={onClose}
            type="button"
          >
            ×
          </IconButton>
        </header>

        {children}
      </section>
    </div>
  );
}

