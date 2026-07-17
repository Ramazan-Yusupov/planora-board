import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/modules/draw-tool/shared/lib";

/** Shared visual shell for floating interface surfaces. */
export const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={cn(
        "border border-border/90 bg-panel/92 shadow-[inset_0_1px_0_rgb(255_255_255/3%)] backdrop-blur-xl",
        className,
      )}
    />
  ),
);

Panel.displayName = "Panel";

