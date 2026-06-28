import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export function Panel({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn("rounded-2xl border border-white/10 bg-control/25 p-3 sm:p-4", className)}
      {...props}
    />
  );
}
