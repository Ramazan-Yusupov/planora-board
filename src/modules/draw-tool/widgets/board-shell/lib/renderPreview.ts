import { getElementBounds, renderElement } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

/** Draws one element centred and scaled to fit inside a dedicated preview canvas. */
export function renderPreview(
  context: CanvasRenderingContext2D,
  element: BoardElement,
  size: number,
) {
  const bounds = getElementBounds(element);
  const padding = Math.max(4, Math.round(size * 0.12));
  const availableSize = Math.max(1, size - padding * 2);
  const scale = Math.min(
    availableSize / Math.max(bounds.width, 1),
    availableSize / Math.max(bounds.height, 1),
    1,
  );

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  context.save();
  context.translate(size / 2, size / 2);
  context.scale(scale, scale);
  context.translate(-centerX, -centerY);
  renderElement(context, element);
  context.restore();
}

