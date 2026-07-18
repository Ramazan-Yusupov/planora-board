"use client";

import {
  Check,
  Code2,
  Copy,
  Heading2,
  List,
  MessageSquare,
  Minus,
  Plus,
  Quote,
  SquareCheck,
  Text,
  Trash2,
} from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type ReactNode,
} from "react";

import type { NoteBlock, NoteBlockType } from "@/features/manage-notes";
import { cn } from "@/shared/lib";

import {
  backgroundColorOptions,
  textColorOptions,
} from "../lib/notesEditorModel";

function useViewportMenuStyle(
  menuRef: RefObject<HTMLDivElement | null>,
  maxHeight = 352,
  placementKey = 0,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) {
      return;
    }

    const margin = 8;
    const rect = menu.getBoundingClientRect();
    const availableHeight = window.innerHeight - margin * 2;
    const nextMaxHeight = Math.min(maxHeight, availableHeight);
    const overflowBottom = rect.bottom - (window.innerHeight - margin);
    const overflowTopAfterShift = rect.top - Math.max(0, overflowBottom);
    const shiftY =
      overflowBottom > 0
        ? -Math.min(overflowBottom, Math.max(0, overflowTopAfterShift - margin))
        : 0;

    setStyle({
      maxHeight: nextMaxHeight,
      transform: shiftY ? `translateY(${shiftY}px)` : undefined,
    });
  }, [maxHeight, menuRef, placementKey]);

  return style;
}

type NotesBlockActionMenuProps = Readonly<{
  block: NoteBlock;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onInsertAfter: () => void;
  onSetBackgroundColor: (color: string | undefined) => void;
  onSetTextColor: (color: string | undefined) => void;
  onTurnInto: (type: NoteBlockType) => void;
}>;

const turnIntoOptions: readonly Readonly<{
  icon: ReactNode;
  label: string;
  type: NoteBlockType;
}>[] = [
  { icon: <Text aria-hidden="true" size={15} />, label: "Text", type: "paragraph" },
  { icon: <Heading2 aria-hidden="true" size={15} />, label: "Heading 2", type: "heading2" },
  { icon: <List aria-hidden="true" size={15} />, label: "Bulleted list", type: "bulleted" },
  { icon: <SquareCheck aria-hidden="true" size={15} />, label: "To-do", type: "todo" },
  { icon: <Quote aria-hidden="true" size={15} />, label: "Quote", type: "quote" },
  { icon: <MessageSquare aria-hidden="true" size={15} />, label: "Callout", type: "callout" },
  { icon: <Code2 aria-hidden="true" size={15} />, label: "Code", type: "code" },
  { icon: <Minus aria-hidden="true" size={15} />, label: "Divider", type: "divider" },
];

export function NotesBlockActionMenu({
  block,
  onClose,
  onDelete,
  onDuplicate,
  onInsertAfter,
  onSetBackgroundColor,
  onSetTextColor,
  onTurnInto,
}: NotesBlockActionMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const viewportStyle = useViewportMenuStyle(menuRef, 304);
  const canChangeColors = block.type !== "linked-card" && block.type !== "table";

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", onClose);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute left-8 top-9 z-40 w-[min(18rem,calc(100vw-3rem))] overflow-y-auto rounded-lg border border-white/12 bg-[#242424] p-1.5 text-white shadow-2xl"
      role="menu"
      style={viewportStyle}
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="grid gap-1">
        <button
          className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium text-white/86 transition hover:bg-white/10"
          role="menuitem"
          type="button"
          onClick={() => {
            onInsertAfter();
            onClose();
          }}
        >
          <Plus aria-hidden="true" size={15} />
          Вставить ниже
        </button>
        <button
          className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium text-white/86 transition hover:bg-white/10"
          role="menuitem"
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
        >
          <Copy aria-hidden="true" size={15} />
          Дублировать
        </button>
      </div>

      <div className="mt-1 border-t border-white/10 pt-2">
        <p className="px-2 py-1 text-xs font-semibold text-white/45">
          Превратить в
        </p>
        <div className="grid gap-1">
          {turnIntoOptions.map((option) => {
            const isActive = block.type === option.type;

            return (
              <button
                key={option.type}
                className={cn(
                  "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10",
                  isActive && "bg-white/10 text-white",
                )}
                role="menuitem"
                type="button"
                onClick={() => {
                  onTurnInto(option.type);
                  onClose();
                }}
              >
                <span className="grid size-4 shrink-0 place-items-center text-white/70">
                  {option.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isActive ? <Check aria-hidden="true" size={14} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {canChangeColors ? (
        <>
          <div className="mt-1 border-t border-white/10 pt-2">
            <p className="px-2 py-1 text-xs font-semibold text-white/45">
              Цвет текста
            </p>
            <div className="grid gap-1">
              {textColorOptions.map((option) => {
                const value = option.id === "default" ? undefined : option.id;
                const isActive = (block.textColor ?? "default") === option.id;

                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10",
                      isActive && "bg-white/10 text-white",
                    )}
                    role="menuitem"
                    type="button"
                    onClick={() => onSetTextColor(value)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-3 rounded-full",
                        option.swatchClassName,
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {isActive ? <Check aria-hidden="true" size={14} /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-1 border-t border-white/10 pt-2">
            <p className="px-2 py-1 text-xs font-semibold text-white/45">
              Фон
            </p>
            <div className="grid gap-1">
              {backgroundColorOptions.map((option) => {
                const value = option.id === "default" ? undefined : option.id;
                const isActive =
                  (block.backgroundColor ?? "default") === option.id;

                return (
                  <button
                    key={option.id}
                    className={cn(
                      "flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-white/10",
                      isActive && "bg-white/10 text-white",
                    )}
                    role="menuitem"
                    type="button"
                    onClick={() => onSetBackgroundColor(value)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-3 rounded-full",
                        option.swatchClassName,
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {isActive ? <Check aria-hidden="true" size={14} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-1 border-t border-white/10 pt-1">
        <button
          className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/12"
          role="menuitem"
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <Trash2 aria-hidden="true" size={15} />
          Удалить
        </button>
      </div>
    </div>
  );
}
