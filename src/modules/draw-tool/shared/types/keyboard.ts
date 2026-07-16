/** A normalized keyboard shortcut used by help dialogs and commands. */
export type ShortcutModifier = "alt" | "ctrl" | "meta" | "shift";

export type KeyboardShortcut = {
  code?: string;
  key: string;
  modifiers?: readonly ShortcutModifier[];
};

