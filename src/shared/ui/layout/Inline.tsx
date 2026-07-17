import { createElement, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib";

type InlineTag = "div" | "span" | "header" | "footer";

type InlineProps<TTag extends InlineTag = "div"> = Readonly<
  {
    tag?: TTag;
    children?: ReactNode;
  } & Omit<HTMLAttributes<HTMLElement>, "children">
>;

export function Inline<TTag extends InlineTag = "div">({
  tag,
  children,
  className,
  ...props
}: InlineProps<TTag>) {
  return createElement(
    tag ?? "div",
    {
      className: cn("flex items-center", className),
      ...props,
    },
    children,
  );
}
