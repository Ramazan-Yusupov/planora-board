import type { ToolId } from "./types";

type ToolListener = () => void;

let activeTool: ToolId = "selection";

const listeners = new Set<ToolListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export const toolStore = {
  get() {
    return activeTool;
  },

  set(nextTool: ToolId) {
    if (activeTool === nextTool) {
      return;
    }

    activeTool = nextTool;
    notifyListeners();
  },

  subscribe(listener: ToolListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

