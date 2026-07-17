"use client";

import { Check, Trash2 } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import type { NoteBlock } from "@/features/manage-notes";
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
  onSetBackgroundColor: (color: string | undefined) => void;
  onSetTextColor: (color: string | undefined) => void;
}>;

export function NotesBlockActionMenu({
  block,
  onClose,
  onDelete,
  onSetBackgroundColor,
  onSetTextColor,
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
    </div>
  );
}
