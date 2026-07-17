import { createElement, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib";

type TitleTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type TitleVariant = "page" | "section" | "card" | "compact";

const titleVariantClassName: Record<TitleVariant, string> = {
  page: "text-2xl font-semibold text-text",
  section: "text-xl font-semibold text-text",
  card: "text-sm font-semibold text-text",
  compact: "truncate text-sm font-semibold text-text",
};

type TitleProps<TTag extends TitleTag = "h2"> = Readonly<
  {
    tag?: TTag;
    title?: ReactNode;
    children?: ReactNode;
    variant?: TitleVariant;
  } & Omit<HTMLAttributes<HTMLHeadingElement>, "children" | "title">
>;

export function Title<TTag extends TitleTag = "h2">({
  tag,
  title,
  children,
  className,
  variant,
  ...props
}: TitleProps<TTag>) {
  return createElement(
    tag ?? "h2",
    {
      className: cn(
        variant ? titleVariantClassName[variant] : undefined,
        className,
      ),
      ...props,
    },
    title ?? children,
  );
}
