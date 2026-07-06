import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib";

export type IconButtonSize = "sm" | "md" | "lg";

type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "aria-label"> &
  Readonly<{
    label: string;
    size?: IconButtonSize;
  }>;

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "size-8 rounded-lg",
  md: "size-9 rounded-xl",
  lg: "size-10 rounded-xl",
};

export function IconButton({
  className,
  label,
  size = "md",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid shrink-0 place-items-center transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
