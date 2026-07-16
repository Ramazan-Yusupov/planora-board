type RafThrottledFunction<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
};

/** Runs at most once per animation frame and keeps the newest arguments. */
export function rafThrottle<Args extends unknown[]>(
  callback: (...args: Args) => void,
): RafThrottledFunction<Args> {
  let frameId: number | null = null;
  let latestArgs: Args | null = null;

  const throttled = ((...args: Args) => {
    latestArgs = args;
    if (frameId !== null) return;

    frameId = requestAnimationFrame(() => {
      frameId = null;
      if (!latestArgs) return;
      const nextArgs = latestArgs;
      latestArgs = null;
      callback(...nextArgs);
    });
  }) as RafThrottledFunction<Args>;

  throttled.cancel = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    latestArgs = null;
  };

  return throttled;
}

