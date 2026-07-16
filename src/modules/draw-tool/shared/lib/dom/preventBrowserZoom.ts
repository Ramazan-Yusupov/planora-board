/**
 * Prevents browser-level Ctrl/Cmd zoom for a specific document while leaving
 * canvas zoom handling to the board. Returns a cleanup function.
 */
export function preventBrowserZoom(target: Document = document) {
  function onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && ["+", "-", "="].includes(event.key)) {
      event.preventDefault();
    }
  }

  target.addEventListener("keydown", onKeyDown);
  return () => target.removeEventListener("keydown", onKeyDown);
}

