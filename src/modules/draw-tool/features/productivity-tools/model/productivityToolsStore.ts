type ProductivityToolsListener = () => void;

let isOpen = false;
const listeners = new Set<ProductivityToolsListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const productivityToolsStore = {
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

  subscribe(listener: ProductivityToolsListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

