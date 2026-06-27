"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type ModalProps = Readonly<{
  title: string;
  children: ReactNode;
  onClose: () => void;
}>;

export function Modal({ title, children, onClose }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end bg-black/35 p-0 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border bg-panel shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-panel px-5 py-4 sm:px-6">
          <h2 className="min-w-0 truncate text-base font-semibold text-text">{title}</h2>
          <button
            aria-label="Закрыть окно"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-text-muted transition hover:bg-control hover:text-text"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
}
