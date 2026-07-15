"use client";

import { useEffect } from "react";

export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const openOnShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    };

    window.addEventListener("keydown", openOnShortcut);

    return () => {
      window.removeEventListener("keydown", openOnShortcut);
    };
  }, [onOpen]);
}
