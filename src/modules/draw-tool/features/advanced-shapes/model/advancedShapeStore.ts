import type { AdvancedElementKind } from "@/modules/draw-tool/entities/element";

type AdvancedShapeListener = () => void;

let activeKind: AdvancedElementKind = "swimlane";
const listeners = new Set<AdvancedShapeListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const advancedShapeStore = {
  get() {
    return activeKind;
  },

  set(kind: AdvancedElementKind) {
    activeKind = kind;
    notify();
  },

  subscribe(listener: AdvancedShapeListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

