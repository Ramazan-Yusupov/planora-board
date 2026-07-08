"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib";

import { IconButton } from "./IconButton";

type ModalProps = Readonly<{
  title: string;
  children: ReactNode;
  onClose: () => void;
  role?: "dialog" | "alertdialog";
  zIndexClassName?: string;
}>;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");
}

export function Modal({
  title,
  children,
  onClose,
  role = "dialog",
  zIndexClassName = "z-[70]",
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frameId = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;

      if (!dialog || dialog.contains(document.activeElement)) {
        return;
      }

      getFocusableElements(dialog).at(0)?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      previouslyFocusedElementRef.current?.focus();
    };
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusableElements = getFocusableElements(dialog);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className={cn(
        "fixed inset-0 flex items-end bg-slate-950/70 h-screen p-0 backdrop-blur-md sm:items-center sm:justify-center sm:p-6",
        zIndexClassName,
      )}
      role={role}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        className="animate-planora-surface-in max-h-[92dvh] scrollbar-none w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-panel shadow-float sm:max-w-2xl sm:rounded-2xl"
        tabIndex={-1}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-panel/90 px-5 py-4 backdrop-blur-xl sm:px-6">
          <h2
            id={titleId}
            className="min-w-0 truncate text-base font-semibold text-text"
          >
            {title}
          </h2>
          <IconButton
            className="text-text-muted hover:bg-control hover:text-text"
            label="Закрыть окно"
            size="lg"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </IconButton>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
}
