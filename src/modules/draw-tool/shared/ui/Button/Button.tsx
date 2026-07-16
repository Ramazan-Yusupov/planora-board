import { forwardRef } from "react";
import { cn } from "@/modules/draw-tool/shared/lib";
import type { ButtonProps } from "./types";

/**
 * Base interactive primitive. Callers remain responsible for semantic variants,
 * while the shared component provides consistent focus, motion and disabled states.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      className={cn(
        "transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 ease-out active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
    />
  ),
);

Button.displayName = "Button";

