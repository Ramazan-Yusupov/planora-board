import type { ToolbarItem } from "../model/toolItems";
import { Button } from "@/modules/draw-tool/shared/ui";
import { cn } from "@/modules/draw-tool/shared/lib";

type ToolButtonProps = {
  disabled?: boolean;
  isActive: boolean;
  item: ToolbarItem;
  onClick: () => void;
};

export function ToolButton({
  disabled = false,
  isActive,
  item,
  onClick,
}: ToolButtonProps) {
  const Icon = item.icon;

  return (
    <Button
      aria-label={`${item.label}. Клавиши ${item.shortcutHint}`}
      aria-pressed={isActive}
      className={cn(
        "relative grid size-10 shrink-0 place-items-center rounded-xl transition-[background-color,color,box-shadow,transform] max-lg:size-11",
        isActive ? "bg-accent text-white shadow-[0_6px_16px_rgb(79_136_232/28%)]" : "text-text hover:bg-control/90",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
      disabled={disabled}
      onClick={onClick}
      title={`${item.label} (${item.shortcutHint})`}
      type="button"
    >
      <Icon aria-hidden size={19} strokeWidth={2} />
      <span className="absolute bottom-0.5 right-1 text-[9px] leading-none opacity-70">
        {item.shortcut}
      </span>
    </Button>
  );
}

