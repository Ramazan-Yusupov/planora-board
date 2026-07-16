type EditingLockListener = () => void;

export type EditingLockState = {
  isLocked: boolean;
};

let state: EditingLockState = {
  isLocked: false,
};

const listeners = new Set<EditingLockListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function setState(nextState: EditingLockState) {
  if (state.isLocked === nextState.isLocked) {
    return;
  }

  state = nextState;
  notifyListeners();
}

export const editingLockStore = {
  get() {
    return state;
  },

  lock() {
    setState({ isLocked: true });
  },

  unlock() {
    setState({ isLocked: false });
  },

  toggle() {
    setState({ isLocked: !state.isLocked });
  },

  subscribe(listener: EditingLockListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

