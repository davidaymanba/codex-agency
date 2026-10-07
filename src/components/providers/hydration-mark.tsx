"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __codexHydrated?: boolean;
  }
}

/** Tells the head failsafe script that JS is alive, so `html.js` reveal states are safe to keep. */
export function HydrationMark() {
  useEffect(() => {
    window.__codexHydrated = true;
  }, []);
  return null;
}
