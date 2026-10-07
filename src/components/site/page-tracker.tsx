"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Sends one beacon per page view (client navigations included). */
export function PageTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    const payload = JSON.stringify({
      path: pathname,
      referrer: first.current ? document.referrer || undefined : undefined,
    });
    first.current = false;
    if (navigator.sendBeacon)
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    else
      fetch("/api/track", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
  }, [pathname]);
  return null;
}
