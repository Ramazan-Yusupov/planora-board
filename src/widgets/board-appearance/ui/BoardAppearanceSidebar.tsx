"use client";

import { Check, Palette, RotateCcw, X } from "lucide-react";
import { useId } from "react";

import {
  BOARD_BACKGROUND_OPTIONS,
  CARD_COLOR_OPTIONS,
  DEFAULT_BOARD_APPEARANCE,
  resolveBoardAppearance,
  type Board,
  type BoardAppearance,
} from "@/entities/board";

type BoardAppearanceSidebarProps = Readonly<{
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onChange: (appearance: BoardAppearance) => void;
}>;

export function BoardAppearanceSidebar({ board, isOpen, onClose, onChange }: BoardAppearanceSidebarProps) {
  const backgroundColorId = useId();
  const cardColorId = useId();
  const resolvedAppearance = resolveBoardAppearance(board.appearance);

  const patchAppearance = (patch: Partial<BoardAppearance>) => {
    onChange({
      ...board.appearance,
      ...patch,
    });
  };

  return (
    <aside
      aria-label="Оформление доски"
      className={`absolute inset-y-0 right-0 z-40 flex w-[min(88vw,23rem)] shrink-0 flex-col border-l border-white/10 bg-panel/95 shadow-2xl backdrop-blur-xl transition-transform duration-200 lg:w-96 ${
        isOpen ? "translate-x-0 lg:relative lg:translate-x-0" : "translate-x-full lg:absolute lg:translate-x-full"
      }`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Palette aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Настройка</p>
            <h2 className="mt-1 text-base font-semibold text-text">Оформление доски</h2>
          </div>
        </div>
        <button
          aria-label="Закрыть оформление"
          className="grid size-10 place-items-center rounded-xl text-text-muted transition hover:bg-control hover:text-text"
          type="button"
          onClick={onClose}
        >
          <X aria-hidden="true" size={20} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Фон доски</h3>
              <p className="mt-1 text-xs leading-5 text-text-muted">Выберите готовую тему или укажите свой цвет.</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {BOARD_BACKGROUND_OPTIONS.filter((option) => option.value !== "custom").map((option) => {
              const isSelected = board.appearance.background === option.value;

              return (
                <button
                  key={option.value}
                  aria-pressed={isSelected}
                  className={`relative min-h-20 overflow-hidden rounded-xl border p-3 text-left transition focus:outline-none ${
                    isSelected ? "border-accent ring-2 ring-accent/35" : "border-white/10 hover:border-white/30"
                  }`}
                  style={{ backgroundColor: option.color, backgroundImage: option.backgroundImage }}
                  type="button"
                  onClick={() => patchAppearance({ background: option.value })}
                >
                  <span className="relative z-10 text-sm font-semibold text-white drop-shadow-sm">{option.label}</span>
                  {isSelected ? (
                    <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-white text-slate-950">
                      <Check aria-hidden="true" size={15} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-control/45 p-3" htmlFor={backgroundColorId}>
            <span>
              <span className="block text-sm font-medium text-text">Свой цвет фона</span>
              <span className="mt-1 block text-xs text-text-muted">Выбранный цвет заменит готовую тему.</span>
            </span>
            <input
              aria-label="Свой цвет фона"
              className="size-11 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1"
              id={backgroundColorId}
              type="color"
              value={resolvedAppearance.backgroundColor}
              onChange={(event) => {
                patchAppearance({
                  background: "custom",
                  customBackgroundColor: event.target.value,
                });
              }}
            />
          </label>
        </section>

        <section className="mt-7 border-t border-white/10 pt-6">
          <div>
            <h3 className="text-sm font-semibold text-text">Цвет карточек</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">Применяется ко всем карточкам этой доски.</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {CARD_COLOR_OPTIONS.filter((option) => option.value !== "custom").map((option) => {
              const isSelected = board.appearance.cardColor === option.value;
              const textColor = option.value === "sand" || option.value === "frost" ? "#0f172a" : "#f8fafc";

              return (
                <button
                  key={option.value}
                  aria-pressed={isSelected}
                  className={`relative flex min-h-14 items-center rounded-xl border px-3 text-left transition ${
                    isSelected ? "border-accent ring-2 ring-accent/35" : "border-white/10 hover:border-white/30"
                  }`}
                  style={{ backgroundColor: option.color, color: textColor }}
                  type="button"
                  onClick={() => patchAppearance({ cardColor: option.value })}
                >
                  <span className="text-sm font-semibold">{option.label}</span>
                  {isSelected ? (
                    <span className="ml-auto grid size-6 place-items-center rounded-full bg-white text-slate-950">
                      <Check aria-hidden="true" size={15} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-control/45 p-3" htmlFor={cardColorId}>
            <span>
              <span className="block text-sm font-medium text-text">Свой цвет карточек</span>
              <span className="mt-1 block text-xs text-text-muted">Текст автоматически станет контрастным.</span>
            </span>
            <input
              aria-label="Свой цвет карточек"
              className="size-11 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1"
              id={cardColorId}
              type="color"
              value={resolvedAppearance.cardSurface.backgroundColor}
              onChange={(event) => {
                patchAppearance({
                  cardColor: "custom",
                  customCardColor: event.target.value,
                });
              }}
            />
          </label>
        </section>

        <button
          className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-text-muted transition hover:bg-control hover:text-text"
          type="button"
          onClick={() => onChange({ ...DEFAULT_BOARD_APPEARANCE })}
        >
          <RotateCcw aria-hidden="true" size={17} />
          Вернуть тёмную тему
        </button>
      </div>
    </aside>
  );
}
