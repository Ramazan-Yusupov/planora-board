import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export type SelectProps = ComponentPropsWithoutRef<"select">;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-white/10 bg-control/45 px-3 text-sm text-text transition focus:border-accent/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
