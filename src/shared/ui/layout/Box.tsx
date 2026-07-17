import { createElement, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib";

type BoxTag =
  | "div"
  | "span"
  | "section"
  | "article"
  | "header"
  | "footer"
  | "main"
  | "aside"
  | "nav";

type BoxProps<TTag extends BoxTag = "div"> = Readonly<
  {
    tag?: TTag;
    children?: ReactNode;
  } & Omit<HTMLAttributes<HTMLElement>, "children">
>;

export function Box<TTag extends BoxTag = "div">({
  tag,
  children,
  className,
  ...props
}: BoxProps<TTag>) {
  return createElement(
    tag ?? "div",
    {
      className: cn(className),
      ...props,
    },
    children,
  );
}
