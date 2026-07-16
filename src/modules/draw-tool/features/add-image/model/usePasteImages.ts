import { useEffect } from "react";
import { getViewportImageAnchor } from "./getViewportImageAnchor";
import { addImageFiles, getSupportedImageFiles } from "./addImageFiles";

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='dialog'], [aria-modal='true']",
    ),
  );
}

/** Adds copied image files at the viewport centre without interfering with text editing. */
export function usePasteImages() {
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const files = getSupportedImageFiles(event.clipboardData?.files ?? []);
      if (files.length === 0) {
        return;
      }

      event.preventDefault();
      void addImageFiles(files, getViewportImageAnchor()).catch(() => undefined);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);
}

