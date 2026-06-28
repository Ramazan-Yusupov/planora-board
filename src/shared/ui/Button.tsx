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
  primary: "bg-accent text-accent-foreground hover:bg-accent-hover",
  secondary: "bg-control text-text hover:bg-control-hover",
  ghost: "text-text-muted hover:bg-control hover:text-text",
  danger: "bg-danger text-slate-950 hover:bg-danger-hover",
  dangerGhost: "text-red-300 hover:bg-red-500/10 hover:text-red-200",
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
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
