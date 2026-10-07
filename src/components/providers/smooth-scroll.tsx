"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { gsap, ScrollTrigger } from "@/lib/animation/gsap";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/use-media";

type ScrollApi = {
  lenis: Lenis | null;
  scrollTo: (
    target: number | string | HTMLElement,
    opts?: { immediate?: boolean; offset?: number },
  ) => void;
  lock: () => void;
  unlock: () => void;
};

const ScrollContext = createContext<ScrollApi | null>(null);

/**
 * The ONE place Lenis is created and wired into GSAP's ticker + ScrollTrigger.
 * Disabled entirely under prefers-reduced-motion (native scroll takes over).
 * Mounted only in the public site layout — the dashboard uses native scroll.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  // Touch devices already scroll natively and smoothly — skip Lenis there (lighter on mobile).
  const fine = useFinePointer();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (reduced || !fine) return;

    const instance = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      autoRaf: false,
    });

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Publishing the external instance to React is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced, fine]);

  // New route → jump to top and re-measure every trigger once the new DOM has painted.
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname, lenis]);

  const api = useMemo<ScrollApi>(
    () => ({
      lenis,
      scrollTo: (target, opts) => {
        if (lenis) {
          lenis.scrollTo(target, { immediate: opts?.immediate, offset: opts?.offset ?? 0 });
          return;
        }
        const top =
          typeof target === "number"
            ? target
            : ((typeof target === "string"
                ? document.querySelector(target)
                : target
              )?.getBoundingClientRect().top ?? 0) +
              window.scrollY +
              (opts?.offset ?? 0);
        window.scrollTo({ top, behavior: opts?.immediate || reduced ? "auto" : "smooth" });
      },
      lock: () => {
        lenis?.stop();
        document.documentElement.style.overflow = "hidden";
      },
      unlock: () => {
        lenis?.start();
        document.documentElement.style.overflow = "";
      },
    }),
    [lenis, reduced],
  );

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}

export function useSmoothScroll() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside <SmoothScrollProvider>");
  return ctx;
}
