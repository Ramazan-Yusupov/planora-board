import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export type TextareaProps = ComponentPropsWithoutRef<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-white/10 bg-control/45 px-3 py-2.5 text-sm leading-6 text-text shadow-[inset_0_1px_0_rgb(255_255_255/3%)] transition-[background-color,border-color,box-shadow] placeholder:text-text-muted focus:border-accent/70 focus:bg-control/70 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
