import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export type TextFieldProps = ComponentPropsWithoutRef<"input">;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text shadow-[inset_0_1px_0_rgb(255_255_255_/_3%)] transition-[background-color,border-color,box-shadow] placeholder:text-text-muted focus:border-accent/70 focus:bg-control/70 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        type={type}
        {...props}
      />
    );
  },
);
