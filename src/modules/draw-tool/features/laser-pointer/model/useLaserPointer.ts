import type { PointerEvent as ReactPointerEvent } from "react";
import { getWorldPointerPosition } from "@/modules/draw-tool/features/draw-shape/lib/getWorldPointerPosition";
import { laserPointerStore } from "./laserPointerStore";

export function useLaserPointer() {
  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) {
      return;
    }

    laserPointerStore.start(getWorldPointerPosition(event));
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    laserPointerStore.add(getWorldPointerPosition(event));
  }

  function finish(event: ReactPointerEvent<HTMLCanvasElement>) {
    laserPointerStore.finish();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    onPointerCancel: finish,
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
  };
}

