import {
  createElement,
  forwardRef,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib";

type SurfaceTag = "div" | "section" | "article" | "aside";

type SurfaceProps<TTag extends SurfaceTag = "section"> = Readonly<
  {
    tag?: TTag;
    children?: ReactNode;
  } & Omit<HTMLAttributes<HTMLElement>, "children">
>;

function SurfaceBase<TTag extends SurfaceTag = "section">(
  { tag, children, className, ...props }: SurfaceProps<TTag>,
  ref: ForwardedRef<HTMLElement>,
) {
  return createElement(
    tag ?? "section",
    {
      className: cn(
        "rounded-lg border border-white/10 bg-panel/72 shadow-[inset_0_1px_0_rgb(255_255_255/_3%)]",
        className,
      ),
      ref,
      ...props,
    },
    children,
  );
}

export const Surface = forwardRef(SurfaceBase) as <
  TTag extends SurfaceTag = "section",
>(
  props: SurfaceProps<TTag> & { ref?: ForwardedRef<HTMLElement> },
) => ReactElement | null;
