type DebouncedFunction<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
  flush: () => void;
};

/** Delays rapid calls and retains only the latest argument list. */
export function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait = 150,
): DebouncedFunction<Args> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Args | null = null;

  function invoke() {
    timeoutId = null;
    if (!latestArgs) return;
    const args = latestArgs;
    latestArgs = null;
    callback(...args);
  }

  const debounced = ((...args: Args) => {
    latestArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(invoke, wait);
  }) as DebouncedFunction<Args>;

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    latestArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId) clearTimeout(timeoutId);
    invoke();
  };

  return debounced;
}

