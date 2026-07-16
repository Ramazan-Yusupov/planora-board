import type { KeyboardShortcut } from "@/modules/draw-tool/shared/types/keyboard";

/** Shared command keys used by canvas features and shortcut documentation. */
export const KEYBOARD_CONFIG = {
  duplicate: { key: "d", modifiers: ["ctrl"] },
  redo: { key: "z", modifiers: ["ctrl", "shift"] },
  resetZoom: { key: "0", modifiers: ["ctrl"] },
  undo: { key: "z", modifiers: ["ctrl"] },
} as const satisfies Record<string, KeyboardShortcut>;

