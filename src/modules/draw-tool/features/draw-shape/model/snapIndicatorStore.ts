import type { Point } from "@/modules/draw-tool/shared/types";

type SnapIndicatorListener = () => void;

let point: Point | null = null;

const listeners = new Set<SnapIndicatorListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export const snapIndicatorStore = {
  get() {
    return point;
  },

  set(nextPoint: Point) {
    const isSamePoint = point?.x === nextPoint.x && point?.y === nextPoint.y;

    if (isSamePoint) {
      return;
    }

    point = nextPoint;
    notifyListeners();
  },

  clear() {
    if (!point) {
      return;
    }

    point = null;
    notifyListeners();
  },

  subscribe(listener: SnapIndicatorListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

