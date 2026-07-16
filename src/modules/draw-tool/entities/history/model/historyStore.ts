import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { applyHistoryEntry } from "./applyHistoryEntry";
import { createHistoryEntry } from "./createHistoryEntry";
import type { HistorySnapshot, HistoryState } from "./types";

type HistoryListener = () => void;

let past: HistorySnapshot[] = [];
let future: HistorySnapshot[] = [];
let pendingSnapshot: HistorySnapshot | null = null;
let version = 0;

let cachedState: HistoryState = {
  canUndo: false,
  canRedo: false,
  version: 0,
};

const listeners = new Set<HistoryListener>();

function createSnapshot(): HistorySnapshot {
  return createHistoryEntry(sceneStore.get());
}

function snapshotsMatch(left: HistorySnapshot, right: HistorySnapshot) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function updateCachedState() {
  cachedState = {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    version,
  };
}

function notifyListeners() {
  version += 1;
  updateCachedState();

  listeners.forEach((listener) => listener());
}

export const historyStore = {
  get(): HistoryState {
    // Важно: всегда возвращает один и тот же объект,
    // пока история не изменилась.
    return cachedState;
  },

  begin() {
    if (pendingSnapshot) {
      return;
    }

    pendingSnapshot = createSnapshot();
  },

  commit() {
    if (!pendingSnapshot) {
      return false;
    }

    const currentSnapshot = createSnapshot();
    const changed = !snapshotsMatch(pendingSnapshot, currentSnapshot);

    if (changed) {
      past.push(pendingSnapshot);
      future = [];
      notifyListeners();
    }

    pendingSnapshot = null;

    return changed;
  },

  cancel() {
    pendingSnapshot = null;
  },

  undo() {
    if (pendingSnapshot || past.length === 0) {
      return false;
    }

    const previousSnapshot = past.pop();

    if (!previousSnapshot) {
      return false;
    }

    future.push(createSnapshot());
    applyHistoryEntry(previousSnapshot);
    notifyListeners();

    return true;
  },

  redo() {
    if (pendingSnapshot || future.length === 0) {
      return false;
    }

    const nextSnapshot = future.pop();

    if (!nextSnapshot) {
      return false;
    }

    past.push(createSnapshot());
    applyHistoryEntry(nextSnapshot);
    notifyListeners();

    return true;
  },

  clear() {
    past = [];
    future = [];
    pendingSnapshot = null;
    notifyListeners();
  },

  subscribe(listener: HistoryListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

