import { createElement, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib";

type StackTag = "div" | "section" | "article" | "main" | "aside";

type StackProps<TTag extends StackTag = "div"> = Readonly<
  {
    tag?: TTag;
    children?: ReactNode;
  } & Omit<HTMLAttributes<HTMLElement>, "children">
>;

export function Stack<TTag extends StackTag = "div">({
  tag,
  children,
  className,
  ...props
}: StackProps<TTag>) {
  return createElement(
    tag ?? "div",
    {
      className: cn("flex flex-col", className),
      ...props,
    },
    children,
  );
}
