type ToolLockListener = () => void;

let isToolLocked = false;
const listeners = new Set<ToolLockListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export const toolLockStore = {
  get() {
    return isToolLocked;
  },

  set(nextValue: boolean) {
    if (isToolLocked === nextValue) {
      return;
    }

    isToolLocked = nextValue;
    notifyListeners();
  },

  toggle() {
    this.set(!isToolLocked);
  },

  subscribe(listener: ToolLockListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

