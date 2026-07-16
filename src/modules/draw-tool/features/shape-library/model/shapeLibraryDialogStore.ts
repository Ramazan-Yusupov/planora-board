type ShapeLibraryDialogListener = () => void;

let isOpen = false;
const listeners = new Set<ShapeLibraryDialogListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const shapeLibraryDialogStore = {
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

  subscribe(listener: ShapeLibraryDialogListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

