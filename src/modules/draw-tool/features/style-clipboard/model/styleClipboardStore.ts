import type { ElementStyle } from "@/modules/draw-tool/entities/element";

type StyleClipboardState = { style: ElementStyle | null; version: number };
type Listener = () => void;
let state: StyleClipboardState = { style: null, version: 0 };
const listeners = new Set<Listener>();
function notify() { listeners.forEach((listener) => listener()); }

export const styleClipboardStore = {
  get() { return state; },
  set(style: ElementStyle) {
    state = { style: { ...style }, version: state.version + 1 };
    notify();
  },
  clear() { state = { style: null, version: state.version + 1 }; notify(); },
  subscribe(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); },
};

