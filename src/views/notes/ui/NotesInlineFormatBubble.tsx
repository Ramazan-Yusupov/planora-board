"use client";

import {
  Bold,
  Code2,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib";

import type { InlineFormat } from "../lib/notesEditorModel";

export type InlineFormatMenuState = Readonly<{
  blockId: string;
  left: number;
  top: number;
  activeFormats: ReadonlySet<InlineFormat>;
}> | null;

type NotesInlineFormatBubbleProps = Readonly<{
  menu: InlineFormatMenuState;
  onFormat: (format: InlineFormat) => void;
}>;

export function NotesInlineFormatBubble({
  menu,
  onFormat,
}: NotesInlineFormatBubbleProps) {
  if (!menu || typeof document === "undefined") {
    return null;
  }

  const actions: ReadonlyArray<{
    format: InlineFormat;
    label: string;
    icon: ReactNode;
  }> = [
    {
      format: "bold",
      label: "Bold",
      icon: <Bold aria-hidden="true" size={15} />,
    },
    {
      format: "italic",
      label: "Italic",
      icon: <Italic aria-hidden="true" size={15} />,
    },
    {
      format: "underline",
      label: "Underline",
      icon: <Underline aria-hidden="true" size={15} />,
    },
    {
      format: "strike",
      label: "Strike",
      icon: <Strikethrough aria-hidden="true" size={15} />,
    },
    {
      format: "code",
      label: "Inline code",
      icon: <Code2 aria-hidden="true" size={15} />,
    },
  ];

  return createPortal(
    <div
      className="fixed z-90 flex items-center gap-1 rounded-lg border border-white/12 bg-[#242424] p-1 text-white shadow-2xl"
      role="toolbar"
      style={{
        left: menu.left,
        top: menu.top,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {actions.map((action) => {
        const isActive = menu.activeFormats.has(action.format);

        return (
          <button
            key={action.format}
            aria-label={action.label}
            aria-pressed={isActive}
            className={cn(
              "grid size-8 place-items-center rounded-md text-white/72 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
              isActive && "bg-white/14 text-white",
            )}
            type="button"
            onClick={() => onFormat(action.format)}
          >
            {action.icon}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
