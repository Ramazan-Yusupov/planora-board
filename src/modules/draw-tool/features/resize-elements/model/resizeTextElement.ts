import { getTextSize } from "@/modules/draw-tool/entities/element";
import type { TextElement } from "@/modules/draw-tool/entities/element";
import { clamp } from "@/modules/draw-tool/shared/lib";
import type { ResizeHandle, ResizeModifiers } from "./types";
import { getGeometry, type GeometryPatch } from "./resizeGeometry";

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 256;

export function resizeTextElement(
  element: TextElement,
  handle: ResizeHandle,
  patch: GeometryPatch,
  modifiers: ResizeModifiers,
): GeometryPatch & Pick<TextElement, "fontSize"> {
  const geometry = getGeometry(element, patch);
  const initialSize = getTextSize(
    element.text || " ",
    element.fontSize,
    element.fontFamily,
  );
  const initialWidth = Math.max(element.width, initialSize.width);
  const initialHeight = Math.max(element.height, initialSize.height);
  const changesHorizontal = handle.includes("e") || handle.includes("w");
  const changesVertical = handle.includes("n") || handle.includes("s");
  const horizontalScale = geometry.width / Math.max(initialWidth, 1);
  const verticalScale = geometry.height / Math.max(initialHeight, 1);
  const scale =
    changesHorizontal && changesVertical
      ? Math.max(horizontalScale, verticalScale)
      : changesHorizontal
        ? horizontalScale
        : verticalScale;
  const fontSize = clamp(
    Math.round(element.fontSize * Math.max(scale, 0.05) * 10) / 10,
    MIN_FONT_SIZE,
    MAX_FONT_SIZE,
  );
  const size = getTextSize(element.text || " ", fontSize, element.fontFamily);
  const originalRight = element.x + initialWidth;
  const originalBottom = element.y + initialHeight;
  const centerX = element.x + initialWidth / 2;
  const centerY = element.y + initialHeight / 2;

  let x = changesHorizontal
    ? handle.includes("w")
      ? originalRight - size.width
      : element.x
    : centerX - size.width / 2;
  let y = changesVertical
    ? handle.includes("n")
      ? originalBottom - size.height
      : element.y
    : centerY - size.height / 2;

  if (modifiers.resizeFromCenter) {
    x = centerX - size.width / 2;
    y = centerY - size.height / 2;
  }

  return { x, y, width: size.width, height: size.height, fontSize };
}

