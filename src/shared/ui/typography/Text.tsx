import { createElement, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib";

type TextTag = "p" | "span" | "div" | "label" | "small" | "strong" | "em";

type TextVariant =
  | "body"
  | "muted"
  | "caption"
  | "eyebrow"
  | "loading"
  | "stat"
  | "itemTitle"
  | "menuLabel"
  | "shortcut"
  | "badge"
  | "status";

const textVariantClassName: Record<TextVariant, string> = {
  body: "text-sm leading-6 text-text-muted",
  muted: "text-sm leading-5 text-text-muted",
  caption: "text-xs leading-5 text-text-muted",
  eyebrow:
    "text-xs font-semibold uppercase tracking-[0.12em] text-text-muted",
  loading:
    "rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm",
  stat: "text-3xl font-semibold tabular-nums text-text",
  itemTitle: "text-sm font-semibold text-text",
  menuLabel: "min-w-0 flex-1 truncate",
  shortcut: "rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
  badge:
    "grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold",
  status: "text-xs font-medium text-text-muted",
};

type TextProps<TTag extends TextTag = "p"> = Readonly<
  {
    tag?: TTag;
    text?: ReactNode;
    children?: ReactNode;
    variant?: TextVariant;
  } & Omit<HTMLAttributes<HTMLElement>, "children">
>;

export function Text<TTag extends TextTag = "p">({
  tag,
  text,
  children,
  className,
  variant,
  ...props
}: TextProps<TTag>) {
  return createElement(
    tag ?? "p",
    {
      className: cn(
        variant ? textVariantClassName[variant] : undefined,
        className,
      ),
      ...props,
    },
    text ?? children,
  );
}
