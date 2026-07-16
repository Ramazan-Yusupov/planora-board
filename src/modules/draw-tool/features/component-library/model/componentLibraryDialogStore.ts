type ComponentLibraryDialogListener = () => void;

let isOpen = false;
const listeners = new Set<ComponentLibraryDialogListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const componentLibraryDialogStore = {
  close() {
    isOpen = false;
    emit();
  },

  get() {
    return isOpen;
  },

  open() {
    isOpen = true;
    emit();
  },

  subscribe(listener: ComponentLibraryDialogListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

