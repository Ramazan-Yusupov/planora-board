import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/modules/draw-tool/shared/lib";
import { Button, Tooltip } from "@/modules/draw-tool/shared/ui";

type MoreToolsMenuItemProps = {
  className?: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  shortcut?: string;
  shortcutHint?: string;
  title?: string;
  trailing?: ReactNode;
  variant?: "default" | "compact" | "icon";
  disabled?: boolean;
};

export function MoreToolsMenuItem({
  className,
  disabled,
  icon: Icon,
  label,
  onClick,
  shortcut,
  shortcutHint,
  title,
  trailing,
  variant = "default",
}: MoreToolsMenuItemProps) {
  const tooltipContent =
    shortcutHint || shortcut ? `${label} (${shortcutHint ?? shortcut})` : label;

  if (variant === "icon") {
    return (
      <Tooltip content={tooltipContent} side="top">
        <Button
          aria-label={label}
          className={cn(
            "group relative grid size-12 place-items-center rounded-xl text-text hover:bg-control hover:shadow-sm focus-visible:bg-control disabled:opacity-40",
            className,
          )}
          disabled={disabled}
          onClick={onClick}
          role="menuitem"
          title={title ?? tooltipContent}
          type="button"
        >
          <Icon
            className="text-text-muted transition-colors group-hover:text-text"
            size={24}
          />
          {shortcut && (
            <kbd className="pointer-events-none absolute bottom-1 right-1 text-[10px] leading-none text-text-muted">
              {shortcut}
            </kbd>
          )}
          {trailing}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button
      className={cn(
        "group flex w-full items-center rounded-lg text-left text-text hover:bg-control hover:shadow-sm focus-visible:bg-control",
        variant === "compact"
          ? "gap-2 px-2 py-2 text-xs"
          : "gap-3 px-3 py-2 text-sm",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      role="menuitem"
      title={title ?? (shortcutHint ? `${label} (${shortcutHint})` : label)}
      type="button"
    >
      <Icon
        className="shrink-0 text-text-muted transition-colors group-hover:text-text"
        size={variant === "compact" ? 16 : 17}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {shortcut && (
        <kbd className="shrink-0 text-xs text-text-muted" title={shortcutHint}>
          {shortcut}
        </kbd>
      )}
      {trailing}
    </Button>
  );
}

