import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/modules/draw-tool/shared/lib";

type PopoverProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  isOpen: boolean;
};

/** Lightweight content shell. Positioning remains owned by the trigger feature. */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  ({ children, className, isOpen, ...props }, ref) => {
    if (!isOpen) {
      return null;
    }

    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          "drawtool-surface-in rounded-2xl border border-border/90 bg-panel/95 p-2 shadow-float backdrop-blur-xl",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

Popover.displayName = "Popover";

