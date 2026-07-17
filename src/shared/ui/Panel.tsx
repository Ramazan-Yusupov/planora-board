import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export function Panel({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-control/22 p-3 shadow-[inset_0_1px_0_rgb(255_255_255/3%)] backdrop-blur-sm sm:p-4",
        className,
      )}
      {...props}
    />
  );
}
