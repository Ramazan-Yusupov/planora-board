import { AlertCircle } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

type FormHintProps = ComponentPropsWithoutRef<"p"> &
  Readonly<{
    tone?: "muted" | "warning";
  }>;

export function FormHint({
  children,
  className,
  tone = "muted",
  ...props
}: FormHintProps) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-xs leading-5",
        tone === "warning" ? "text-amber-200" : "text-text-muted",
        className,
      )}
      {...props}
    >
      {tone === "warning" ? (
        <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={14} />
      ) : null}
      <span className="min-w-0">{children}</span>
    </p>
  );
}
