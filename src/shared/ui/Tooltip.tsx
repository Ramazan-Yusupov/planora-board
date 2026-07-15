"use client";

import { type ReactNode } from "react";

import { cn } from "@/shared/lib";

type TooltipSide = "bottom" | "top";

type TooltipProps = Readonly<{
  children: ReactNode;
  label: string;
  side?: TooltipSide;
  className?: string;
}>;

export function Tooltip({
  children,
  label,
  side = "bottom",
  className,
}: TooltipProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 z-[80] -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/95 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-2xl transition group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "bottom"
            ? "top-[calc(100%+0.5rem)]"
            : "bottom-[calc(100%+0.5rem)]",
        )}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
