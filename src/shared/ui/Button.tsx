import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerGhost";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  Readonly<{
    variant?: ButtonVariant;
    size?: ButtonSize;
  }>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-accent/25 bg-accent text-accent-foreground shadow-[0_6px_18px_rgb(59_130_246/20%)] hover:bg-accent-hover hover:shadow-[0_10px_26px_rgb(59_130_246/28%)]",
  secondary:
    "border border-white/8 bg-control/85 text-text shadow-[inset_0_1px_0_rgb(255_255_255/4%)] hover:bg-control-hover",
  ghost:
    "text-text-muted hover:bg-control/75 hover:text-text",
  danger:
    "border border-red-400/15 bg-danger text-slate-950 shadow-[0_6px_18px_rgb(239_68_68/14%)] hover:bg-danger-hover",
  dangerGhost: "text-red-300 hover:bg-red-500/10 hover:text-red-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
