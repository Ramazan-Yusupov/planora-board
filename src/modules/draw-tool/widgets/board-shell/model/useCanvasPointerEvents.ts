import { useEffect, useRef } from "react";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import { getCanvasPointerPosition } from "@/modules/draw-tool/shared/lib/dom/getCanvasPointerPosition";
import { rafThrottle } from "@/modules/draw-tool/shared/lib/performance/rafThrottle";
import type { Point } from "@/modules/draw-tool/shared/types";

type PanState = {
  pointerId: number;
  startPoint: Point;
  startViewport: ReturnType<typeof viewportStore.get>;
};

type RafPanUpdater = ReturnType<typeof rafThrottle<[Point]>>;

function applyPanPoint(panState: PanState, currentPoint: Point) {
  const deltaX = currentPoint.x - panState.startPoint.x;
  const deltaY = currentPoint.y - panState.startPoint.y;

  viewportStore.set({
    ...panState.startViewport,
    x: panState.startViewport.x - deltaX / panState.startViewport.zoom,
    y: panState.startViewport.y - deltaY / panState.startViewport.zoom,
  });
}

export function useCanvasPointerEvents() {
  const panStateRef = useRef<PanState | null>(null);
  const updatePanRef = useRef<RafPanUpdater | null>(null);

  useEffect(() => {
    const updatePan = rafThrottle((currentPoint: Point) => {
      const panState = panStateRef.current;

      if (!panState) {
        return;
      }

      applyPanPoint(panState, currentPoint);
    });

    updatePanRef.current = updatePan;

    return () => {
      updatePan.cancel();
      updatePanRef.current = null;
    };
  }, []);

  function onPointerDown(
    event: React.PointerEvent<HTMLCanvasElement>,
    allowPrimaryButton = false,
  ) {
    const isMiddleButton = event.button === 1;
    const isPrimaryButton = allowPrimaryButton && event.button === 0;

    if (!isMiddleButton && !isPrimaryButton) {
      return;
    }

    event.preventDefault();

    panStateRef.current = {
      pointerId: event.pointerId,
      startPoint: getCanvasPointerPosition(
        event.nativeEvent,
        event.currentTarget,
      ),
      startViewport: viewportStore.get(),
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const panState = panStateRef.current;

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    updatePanRef.current?.(
      getCanvasPointerPosition(event.nativeEvent, event.currentTarget),
    );
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const panState = panStateRef.current;

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    updatePanRef.current?.cancel();
    applyPanPoint(
      panState,
      getCanvasPointerPosition(event.nativeEvent, event.currentTarget),
    );
    panStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

