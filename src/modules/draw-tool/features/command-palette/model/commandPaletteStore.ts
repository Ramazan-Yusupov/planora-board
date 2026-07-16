type CommandPaletteListener = () => void;

let isOpen = false;
const listeners = new Set<CommandPaletteListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const commandPaletteStore = {
  get() {
    return isOpen;
  },

  open() {
    isOpen = true;
    notify();
  },

  close() {
    isOpen = false;
    notify();
  },

  subscribe(listener: CommandPaletteListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

