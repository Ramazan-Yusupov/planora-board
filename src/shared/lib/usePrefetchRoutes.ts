"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

type IdleCallbackWindow = Window &
  typeof globalThis & {
    cancelIdleCallback?: (id: number) => void;
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
  };

export function usePrefetchRoutes(routes: readonly (string | null | undefined)[]) {
  const router = useRouter();
  const routeKey = useMemo(
    () =>
      Array.from(
        new Set(routes.filter((route): route is string => Boolean(route))),
      ).join("|"),
    [routes],
  );

  useEffect(() => {
    if (!routeKey) {
      return;
    }

    const routesToPrefetch = routeKey.split("|");
    const prefetchRoutes = () => {
      routesToPrefetch.forEach((route) => router.prefetch(route));
    };

    const idleWindow = window as IdleCallbackWindow;

    if (typeof idleWindow.requestIdleCallback === "function") {
      const idleId = idleWindow.requestIdleCallback(prefetchRoutes, {
        timeout: 1600,
      });

      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(prefetchRoutes, 650);

    return () => window.clearTimeout(timeoutId);
  }, [routeKey, router]);
}
