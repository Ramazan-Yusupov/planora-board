import type { LucideIcon } from "lucide-react";
import { cn } from "@/modules/draw-tool/shared/lib";
import { Button } from "../Button/Button";

type SegmentedItem<T extends string> = {
  label: string;
  value: T;
  icon?: LucideIcon;
  iconOnly?: boolean;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  items: readonly SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  label,
  items,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="my-3 border-0 p-0">
      <legend className="mb-2 text-xs font-medium text-text-muted">
        {label}
      </legend>

      <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg">
        {items.map((item) => {
          const isActive = item.value === value;
          const Icon = item.icon;

          return (
            <Button
              aria-label={item.label}
              aria-pressed={isActive}
              className={cn(
                "flex min-h-9 items-center justify-center gap-1 rounded-md border border-transparent px-2 text-xs transition-colors",
                isActive
                  ? "bg-control-active font-medium text-white shadow-sm"
                  : "bg-control text-text hover:bg-surface-muted",
                item.iconOnly && "px-1.5",
              )}
              key={item.value}
              onClick={() => onChange(item.value)}
              title={item.label}
              type="button"
            >
              {Icon && <Icon aria-hidden size={17} strokeWidth={2} />}
              {!item.iconOnly && <span>{item.label}</span>}
              {item.iconOnly && <span className="sr-only">{item.label}</span>}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

