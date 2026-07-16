type FramePresentationState = {
  frameId: string | null;
  isOpen: boolean;
};

type FramePresentationListener = () => void;

let state: FramePresentationState = {
  frameId: null,
  isOpen: false,
};
const listeners = new Set<FramePresentationListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const framePresentationStore = {
  close() {
    state = { frameId: null, isOpen: false };
    emit();
  },

  get() {
    return state;
  },

  open(frameId: string) {
    state = { frameId, isOpen: true };
    emit();
  },

  setFrame(frameId: string) {
    state = { frameId, isOpen: true };
    emit();
  },

  subscribe(listener: FramePresentationListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

