import { getVisibleBounds, viewportStore } from "@/modules/draw-tool/entities/viewport";

/** Places picker and clipboard images in the visual centre of the current canvas. */
export function getViewportImageAnchor() {
  const visibleBounds = getVisibleBounds(viewportStore.get(), {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  return {
    x: visibleBounds.x + visibleBounds.width / 2,
    y: visibleBounds.y + visibleBounds.height / 2,
  };
}

