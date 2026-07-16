import type { HTMLAttributes } from "react";
import { cn } from "@/modules/draw-tool/shared/lib";

type DividerProps = HTMLAttributes<HTMLSpanElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Divider({
  className,
  orientation = "horizontal",
  ...props
}: DividerProps) {
  return (
    <span
      {...props}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "h-7 w-px" : "h-px w-full",
        className,
      )}
      role="separator"
    />
  );
}

