import { createElement, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib";

type FlexTag = "div" | "span" | "section" | "article" | "header" | "footer";

type FlexProps<TTag extends FlexTag = "div"> = Readonly<
  {
    tag?: TTag;
    children?: ReactNode;
  } & Omit<HTMLAttributes<HTMLElement>, "children">
>;

export function Flex<TTag extends FlexTag = "div">({
  tag,
  children,
  className,
  ...props
}: FlexProps<TTag>) {
  return createElement(
    tag ?? "div",
    {
      className: cn("flex", className),
      ...props,
    },
    children,
  );
}
