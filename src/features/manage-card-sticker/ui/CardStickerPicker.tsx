"use client";

import dynamic from "next/dynamic";
import {
  ChevronDown,
  ChevronUp,
  Dice5,
  SmilePlus,
  X,
} from "lucide-react";
import { useId, useState } from "react";
import type {
  EmojiClickData,
  EmojiStyle,
  Theme,
} from "emoji-picker-react";

import {
  CARD_STICKERS,
  getRandomCardSticker,
} from "@/entities/board";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => null,
});

type CardStickerPickerProps = Readonly<{
  sticker: string | undefined;
  onChange: (sticker: string | undefined) => void;
}>;

export function CardStickerPicker({
  sticker,
  onChange,
}: CardStickerPickerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerId = useId();

  const selectSticker = (nextSticker: string | undefined) => {
    onChange(nextSticker);
    setIsPickerOpen(false);
  };

  return (
    <section
      className="rounded-2xl border border-white/10 bg-control/20 p-3 sm:p-4"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isPickerOpen) {
          event.preventDefault();
          event.stopPropagation();
          setIsPickerOpen(false);
        }
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          aria-controls={pickerId}
          aria-expanded={isPickerOpen}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
          type="button"
          onClick={() => setIsPickerOpen((current) => !current)}
        >
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-panel/70 text-2xl shadow-sm"
          >
            {sticker ?? <SmilePlus className="text-text-muted" size={22} />}
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-semibold text-text">
              Стикер карточки
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-text-muted">
              {sticker
                ? "Нажмите, чтобы выбрать другой стикер."
                : "Выберите эмодзи или оставьте карточку без стикера."}
            </span>
          </span>

          {isPickerOpen ? (
            <ChevronUp
              aria-hidden="true"
              className="ml-auto shrink-0 text-text-muted"
              size={18}
            />
          ) : (
            <ChevronDown
              aria-hidden="true"
              className="ml-auto shrink-0 text-text-muted"
              size={18}
            />
          )}
        </button>

        <Button
          className="justify-center sm:shrink-0"
          size="sm"
          variant="secondary"
          onClick={() => selectSticker(getRandomCardSticker())}
        >
          <Dice5 aria-hidden="true" size={16} />
          Случайный
        </Button>
      </div>

      {isPickerOpen ? (
        <div
          id={pickerId}
          className="mt-4 border-t border-white/10 pt-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Быстрый выбор
          </p>

          <div className="mt-2 grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {CARD_STICKERS.map((item) => (
              <button
                key={item.emoji}
                aria-label={`Выбрать стикер: ${item.label}`}
                className={cn(
                  "grid aspect-square place-items-center rounded-xl border text-xl transition hover:-translate-y-0.5 hover:bg-panel focus-visible:ring-2 focus-visible:ring-ring",
                  sticker === item.emoji
                    ? "border-accent bg-accent/15"
                    : "border-white/10 bg-panel/55",
                )}
                title={item.label}
                type="button"
                onClick={() => selectSticker(item.emoji)}
              >
                <span aria-hidden="true">{item.emoji}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-panel/55">
            <EmojiPicker
              autoFocusSearch={false}
              emojiStyle={"native" as EmojiStyle}
              height={360}
              lazyLoadEmojis
              previewConfig={{ showPreview: false }}
              searchPlaceholder="Поиск стикеров"
              skinTonesDisabled
              theme={"dark" as Theme}
              width="100%"
              onEmojiClick={(emojiData: EmojiClickData) =>
                selectSticker(emojiData.emoji)
              }
            />
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              disabled={!sticker}
              size="sm"
              variant="ghost"
              onClick={() => selectSticker(undefined)}
            >
              <X aria-hidden="true" size={16} />
              Убрать стикер
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
