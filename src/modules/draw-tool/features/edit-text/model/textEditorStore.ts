type TextEditorState = {
  elementId: string | null;
  mode: "label" | "text";
  wasCreated: boolean;
};

type TextEditorListener = () => void;

let editorState: TextEditorState = {
  elementId: null,
  mode: "text",
  wasCreated: false,
};
const listeners = new Set<TextEditorListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export const textEditorStore = {
  get() {
    return editorState;
  },

  open(elementId: string, wasCreated = false) {
    editorState = { elementId, mode: "text", wasCreated };
    notifyListeners();
  },

  openLabel(elementId: string) {
    editorState = { elementId, mode: "label", wasCreated: false };
    notifyListeners();
  },

  close() {
    if (!editorState.elementId) {
      return;
    }

    editorState = { elementId: null, mode: "text", wasCreated: false };
    notifyListeners();
  },

  subscribe(listener: TextEditorListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

