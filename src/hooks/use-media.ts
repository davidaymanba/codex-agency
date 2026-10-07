"use client";

import { useCallback, useSyncExternalStore } from "react";

/** SSR-safe media query hook (returns `serverValue` during SSR/hydration). */
export function useMedia(query: string, serverValue = false) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const usePrefersReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");

/** True on devices with a precise pointer that can hover (desktop). */
export const useFinePointer = () => useMedia("(hover: hover) and (pointer: fine)");
