"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type RefCallback,
} from "react";

import type { NoteBlock } from "@/features/manage-notes";
import { cn } from "@/shared/lib";

import {
  escapeInlineHtml,
  getBlockInlineHtml,
  sanitizeInlineHtml,
} from "../lib/notesEditorModel";

type NotesEditableBlockProps = Readonly<{
  block: NoteBlock;
  className: string;
  registerElement: RefCallback<HTMLElement>;
  style?: CSSProperties;
  onBlur: (element: HTMLElement) => void;
  onInput: (element: HTMLElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPasteMarkdown: (text: string, element: HTMLElement) => boolean;
  onSelectionChange: (element: HTMLElement) => void;
}>;

export function NotesEditableBlock({
  block,
  className,
  registerElement,
  style,
  onBlur,
  onInput,
  onKeyDown,
  onPasteMarkdown,
  onSelectionChange,
}: NotesEditableBlockProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || document.activeElement === element) {
      return;
    }

    const html = getBlockInlineHtml(block);

    if (sanitizeInlineHtml(element.innerHTML) !== html) {
      element.innerHTML = html;
    }
  }, [block]);

  return (
    <div
      ref={(element) => {
        elementRef.current = element;
        registerElement(element);

        if (element && document.activeElement !== element) {
          element.innerHTML = getBlockInlineHtml(block);
        }
      }}
      className={cn(
        className,
        "cursor-text [&_code]:rounded [&_code]:border [&_code]:border-white/10 [&_code]:bg-white/8 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-sky-100",
      )}
      contentEditable
      data-placeholder="Напишите что-нибудь или введите ###, ---, -"
      role="textbox"
      style={style}
      suppressContentEditableWarning
      onBlur={(event) => onBlur(event.currentTarget)}
      onInput={(event) => onInput(event.currentTarget)}
      onKeyDown={onKeyDown}
      onKeyUp={(event) => onSelectionChange(event.currentTarget)}
      onMouseUp={(event) => onSelectionChange(event.currentTarget)}
      onPaste={(event) => {
        const text = event.clipboardData.getData("text/plain");

        if (onPasteMarkdown(text, event.currentTarget)) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        document.execCommand("insertHTML", false, escapeInlineHtml(text));
        onInput(event.currentTarget);
      }}
    />
  );
}
