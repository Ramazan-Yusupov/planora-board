import { useEffect, useRef } from "react";
import { resizeCanvas } from "@/modules/draw-tool/shared/lib/canvas/resizeCanvas";
import type { CanvasSize } from "@/modules/draw-tool/shared/lib/canvas/resizeCanvas";

type UseCanvasSizeParams = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onResize: (size: CanvasSize) => void;
};

export function useCanvasSize({ canvasRef, onResize }: UseCanvasSizeParams) {
  const onResizeRef = useRef(onResize);

  // eslint-disable-next-line react-hooks/refs
  onResizeRef.current = onResize;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const updateCanvasSize = () => {
      onResizeRef.current(resizeCanvas(canvas));
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);

    resizeObserver.observe(canvas);
    updateCanvasSize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef]);
}

