import type { PointerEvent as ReactPointerEvent } from "react";
import { screenToWorld, viewportStore } from "@/modules/draw-tool/entities/viewport";
import { getCanvasPointerPosition } from "@/modules/draw-tool/shared/lib/dom/getCanvasPointerPosition";

export function getWorldPointerPosition(
  event: ReactPointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>,
) {
  const screenPoint = getCanvasPointerPosition(
    event.nativeEvent,
    event.currentTarget,
  );

  return screenToWorld(screenPoint, viewportStore.get());
}

