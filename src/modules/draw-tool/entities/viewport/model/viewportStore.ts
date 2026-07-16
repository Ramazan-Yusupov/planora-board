import { createViewport } from "./createViewport";
import type { Viewport } from "./types";

type ViewportListener = () => void;

let viewport = createViewport();

const listeners = new Set<ViewportListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function isValidViewport(value: Viewport) {
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.zoom) &&
    value.zoom > 0
  );
}

export const viewportStore = {
  get() {
    return viewport;
  },

  set(nextViewport: Viewport) {
    if (!isValidViewport(nextViewport)) {
      return;
    }

    viewport = nextViewport;
    notifyListeners();
  },

  update(updater: (currentViewport: Viewport) => Viewport) {
    this.set(updater(viewport));
  },

  reset() {
    this.set(createViewport());
  },

  subscribe(listener: ViewportListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

