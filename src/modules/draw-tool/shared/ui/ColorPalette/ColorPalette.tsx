import { Palette } from "lucide-react";
import type { ColorOption } from "@/modules/draw-tool/shared/types";
import { cn } from "@/modules/draw-tool/shared/lib";
import { Button } from "../Button/Button";

type ColorPaletteProps = {
  label: string;
  options: readonly ColorOption[];
  value: string;
  onChange: (value: string) => void;
  /** Добавляет нативный выбор произвольного цвета. */
  allowCustom?: boolean;
};

function isColorValue(value: string) {
  return (
    /^#[0-9a-f]{3,8}$/i.test(value) ||
    /^rgb\(/i.test(value) ||
    /^hsl\(/i.test(value)
  );
}

export function ColorPalette({
  label,
  options,
  value,
  onChange,
  allowCustom = true,
}: ColorPaletteProps) {
  const currentCustomValue = isColorValue(value) ? value : "#000000";

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 text-xs font-medium text-text-muted">
        {label}
      </legend>

      <div
        className="
          grid min-w-0 grid-cols-[repeat(auto-fit,minmax(3rem,1fr))]
          gap-2
        "
      >
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <Button
              aria-label={option.label}
              aria-pressed={isActive}
              className={cn(
                "aspect-square w-full min-w-0 rounded-md border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel",
                isActive
                  ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-panel"
                  : "border-border",
              )}
              key={option.value}
              onClick={() => onChange(option.value)}
              style={
                option.value === "transparent"
                  ? {
                      backgroundImage:
                        "linear-gradient(45deg, #64748b 25%, transparent 25%, transparent 75%, #64748b 75%)",
                      backgroundSize: "8px 8px",
                    }
                  : { backgroundColor: option.value }
              }
              type="button"
            />
          );
        })}

        {allowCustom && (
          <label
            className="
              relative aspect-square w-full min-w-0 cursor-pointer
              overflow-hidden rounded-md border border-border bg-control
              text-text-muted transition-transform
              hover:scale-105 hover:text-text
              focus-within:ring-2 focus-within:ring-accent
              focus-within:ring-offset-2 focus-within:ring-offset-panel
            "
            title={`Выбрать свой цвет: ${label.toLowerCase()}`}
          >
            <span className="absolute inset-0 grid place-items-center">
              <Palette aria-hidden size={16} />
            </span>

            <input
              aria-label={`Открыть палитру: ${label.toLowerCase()}`}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              onChange={(event) => onChange(event.currentTarget.value)}
              type="color"
              value={currentCustomValue}
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}

