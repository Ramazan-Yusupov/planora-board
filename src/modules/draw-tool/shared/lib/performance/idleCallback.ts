export type IdleCallbackHandle = number;

type IdleWindow = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/** Schedules non-critical work with a timeout fallback for unsupported browsers. */
export function scheduleIdleCallback(
  callback: () => void,
  timeout = 500,
): IdleCallbackHandle {
  if (typeof window === "undefined") return 0;

  const idleWindow = window as IdleWindow;
  if (idleWindow.requestIdleCallback) {
    return idleWindow.requestIdleCallback(callback, { timeout });
  }

  return window.setTimeout(callback, timeout);
}

/** Cancels work scheduled with scheduleIdleCallback. */
export function cancelIdleCallback(handle: IdleCallbackHandle) {
  if (typeof window === "undefined") return;

  const idleWindow = window as IdleWindow;
  if (idleWindow.cancelIdleCallback) {
    idleWindow.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
}

