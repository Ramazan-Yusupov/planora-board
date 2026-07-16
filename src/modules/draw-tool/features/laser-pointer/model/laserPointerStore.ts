import type { Point } from "@/modules/draw-tool/shared/types";

type LaserState = {
  points: Point[];
  active: boolean;
  fadeProgress: number;
  version: number;
};

type LaserListener = () => void;

let state: LaserState = {
  points: [],
  active: false,
  fadeProgress: 0,
  version: 0,
};
const listeners = new Set<LaserListener>();
let fadeFrame: number | null = null;

const FADE_DURATION_MS = 560;

function notify() {
  listeners.forEach((listener) => listener());
}

function set(next: Omit<LaserState, "version">) {
  state = { ...next, version: state.version + 1 };
  notify();
}

function cancelFadeAnimation() {
  if (fadeFrame !== null) {
    window.cancelAnimationFrame(fadeFrame);
    fadeFrame = null;
  }
}

function animateFade(startedAt: number) {
  fadeFrame = window.requestAnimationFrame((now) => {
    const progress = Math.min((now - startedAt) / FADE_DURATION_MS, 1);

    if (progress >= 1) {
      fadeFrame = null;
      set({ points: [], active: false, fadeProgress: 0 });
      return;
    }

    set({ points: state.points, active: false, fadeProgress: progress });
    animateFade(startedAt);
  });
}

export const laserPointerStore = {
  get() {
    return state;
  },

  start(point: Point) {
    cancelFadeAnimation();
    set({ points: [point], active: true, fadeProgress: 0 });
  },

  add(point: Point) {
    if (!state.active) {
      return;
    }

    const previous = state.points.at(-1);
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 1) {
      return;
    }

    set({
      points: [...state.points.slice(-40), point],
      active: true,
      fadeProgress: 0,
    });
  },

  finish() {
    if (!state.active) {
      return;
    }

    cancelFadeAnimation();
    set({ points: state.points, active: false, fadeProgress: 0 });
    animateFade(performance.now());
  },

  clear() {
    cancelFadeAnimation();
    set({ points: [], active: false, fadeProgress: 0 });
  },

  subscribe(listener: LaserListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

