import { useEffect } from "react";
import { viewportStore, zoomAtPoint } from "@/modules/draw-tool/entities/viewport";
import { CANVAS_CONFIG } from "@/modules/draw-tool/shared/config";
import { getCanvasPointerPosition } from "@/modules/draw-tool/shared/lib/dom/getCanvasPointerPosition";

export function useCanvasWheel(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const viewport = viewportStore.get();
      const pointer = getCanvasPointerPosition(event, canvas);

      if (event.ctrlKey || event.metaKey) {
        const scale = Math.exp(-event.deltaY * CANVAS_CONFIG.zoomSensitivity);

        viewportStore.set(
          zoomAtPoint(viewport, pointer, viewport.zoom * scale),
        );

        return;
      }

      const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;

      viewportStore.set({
        ...viewport,
        x: viewport.x + horizontalDelta / viewport.zoom,
        y: viewport.y + event.deltaY / viewport.zoom,
      });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [canvasRef]);
}

