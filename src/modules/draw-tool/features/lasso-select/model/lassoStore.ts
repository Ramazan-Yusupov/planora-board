import type { Point } from "@/modules/draw-tool/shared/types";

type LassoState = { points: Point[]; version: number };
type LassoListener = () => void;

let state: LassoState = { points: [], version: 0 };
const listeners = new Set<LassoListener>();

function set(points: Point[]) {
  state = { points, version: state.version + 1 };
  listeners.forEach((listener) => listener());
}

export const lassoStore = {
  get() {
    return state;
  },
  set(points: Point[]) {
    set(points);
  },
  clear() {
    set([]);
  },
  subscribe(listener: LassoListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

