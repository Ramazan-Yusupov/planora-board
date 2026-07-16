import { useCallback, useSyncExternalStore } from "react";
import { viewportStore, zoomAtPoint } from "@/modules/draw-tool/entities/viewport";

function viewportCenter() {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/** Viewport zoom commands shared by buttons, shortcuts and menus. */
export function useZoomControls() {
  const viewport = useSyncExternalStore(viewportStore.subscribe, viewportStore.get, viewportStore.get);
  const setZoomMultiplier = useCallback((multiplier: number) => {
    const current = viewportStore.get();
    viewportStore.set(zoomAtPoint(current, viewportCenter(), current.zoom * multiplier));
  }, []);

  return {
    resetZoom: useCallback(() => viewportStore.reset(), []),
    zoom: viewport.zoom,
    zoomIn: useCallback(() => setZoomMultiplier(1.1), [setZoomMultiplier]),
    zoomOut: useCallback(() => setZoomMultiplier(1 / 1.1), [setZoomMultiplier]),
  };
}

