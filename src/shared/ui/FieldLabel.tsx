import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export function FieldLabel({ className, ...props }: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn("flex items-center gap-2 text-sm font-medium text-text", className)}
      {...props}
    />
  );
}
