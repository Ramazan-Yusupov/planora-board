import { createElement, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib";

type GridTag = "div" | "section" | "article" | "main";

type GridProps<TTag extends GridTag = "div"> = Readonly<
  {
    tag?: TTag;
    children?: ReactNode;
  } & Omit<HTMLAttributes<HTMLElement>, "children">
>;

export function Grid<TTag extends GridTag = "div">({
  tag,
  children,
  className,
  ...props
}: GridProps<TTag>) {
  return createElement(
    tag ?? "div",
    {
      className: cn("grid", className),
      ...props,
    },
    children,
  );
}
