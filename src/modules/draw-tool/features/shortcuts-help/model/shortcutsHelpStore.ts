type ShortcutsHelpListener = () => void;

let isOpen = false;
const listeners = new Set<ShortcutsHelpListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const shortcutsHelpStore = {
  get() {
    return isOpen;
  },

  open() {
    if (isOpen) return;
    isOpen = true;
    notify();
  },

  close() {
    if (!isOpen) return;
    isOpen = false;
    notify();
  },

  toggle() {
    isOpen = !isOpen;
    notify();
  },

  subscribe(listener: ShortcutsHelpListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

