import type { Point } from "@/modules/draw-tool/shared/types";

type ArrowBindingIndicator = {
  targetId: string;
  anchorPoint: Point;
} | null;

type ArrowBindingIndicatorListener = () => void;

let indicator: ArrowBindingIndicator = null;
const listeners = new Set<ArrowBindingIndicatorListener>();

function samePoint(first: Point, second: Point) {
  return first.x === second.x && first.y === second.y;
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export const arrowBindingIndicatorStore = {
  get() {
    return indicator;
  },

  set(next: Exclude<ArrowBindingIndicator, null>) {
    if (
      indicator?.targetId === next.targetId &&
      samePoint(indicator.anchorPoint, next.anchorPoint)
    ) {
      return;
    }

    indicator = next;
    notifyListeners();
  },

  clear() {
    if (!indicator) {
      return;
    }

    indicator = null;
    notifyListeners();
  },

  subscribe(listener: ArrowBindingIndicatorListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

