import { cn } from "@/modules/draw-tool/shared/lib";
import type { Rect } from "@/modules/draw-tool/shared/types";

type SelectionFrameProps = { className?: string; rect: Rect };

/** DOM outline used for the live area-selection rectangle. */
export function SelectionFrame({ className, rect }: SelectionFrameProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-0 top-0 border-2 border-accent will-change-transform",
        className,
      )}
      style={{
        height: rect.height,
        transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
        width: rect.width,
      }}
    />
  );
}

