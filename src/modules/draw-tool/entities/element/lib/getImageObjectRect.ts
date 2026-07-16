import type { Rect } from "@/modules/draw-tool/shared/types";
import type { ImageObjectFit, ImageObjectPosition } from "../model/types";

function getAlignment(position: ImageObjectPosition) {
  if (position === "top") return { x: 0.5, y: 0 };
  if (position === "bottom") return { x: 0.5, y: 1 };
  if (position === "left") return { x: 0, y: 0.5 };
  if (position === "right") return { x: 1, y: 0.5 };
  return { x: 0.5, y: 0.5 };
}

export function getImageObjectRect(
  frame: Rect,
  sourceWidth: number,
  sourceHeight: number,
  fit: ImageObjectFit,
  position: ImageObjectPosition,
): Rect {
  const safeSourceWidth = Math.max(1, sourceWidth);
  const safeSourceHeight = Math.max(1, sourceHeight);
  const frameWidth = Math.max(1, frame.width);
  const frameHeight = Math.max(1, frame.height);
  let width = frameWidth;
  let height = frameHeight;

  if (fit !== "fill") {
    const containScale = Math.min(
      frameWidth / safeSourceWidth,
      frameHeight / safeSourceHeight,
    );
    const coverScale = Math.max(
      frameWidth / safeSourceWidth,
      frameHeight / safeSourceHeight,
    );
    const scale =
      fit === "cover"
        ? coverScale
        : fit === "none"
          ? 1
          : fit === "scale-down"
            ? Math.min(1, containScale)
            : containScale;

    width = safeSourceWidth * scale;
    height = safeSourceHeight * scale;
  }

  const alignment = getAlignment(position);

  return {
    x: frame.x + (frameWidth - width) * alignment.x,
    y: frame.y + (frameHeight - height) * alignment.y,
    width,
    height,
  };
}

