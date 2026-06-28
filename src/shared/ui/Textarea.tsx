import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export type TextareaProps = ComponentPropsWithoutRef<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-white/10 bg-control/45 px-3 py-2.5 text-sm leading-6 text-text placeholder:text-text-muted transition focus:border-accent/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
