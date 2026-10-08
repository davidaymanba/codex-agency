"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

type ParallaxLayerProps = {
  children: ReactNode;
  /** Positive drifts up faster than scroll, negative lags behind. ~-1…1. */
  speed?: number;
  className?: string;
};

/** Scroll-scrubbed vertical drift (mouse/trackpad devices only). Halved on small screens, off under reduced motion. */
export function ParallaxLayer({ children, speed = 0.2, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const mm = gsap.matchMedia();
      // Touch screens scroll on the compositor while scrubbed transforms update on the main
      // thread, so the layer visibly lags and shakes — keep parallax to mouse/trackpad devices.
      mm.add("(hover: hover) and (pointer: fine)", () => {
        const amount = speed * (window.innerWidth < 768 ? 50 : 100);
        gsap.fromTo(
          ref.current,
          { y: amount },
          {
            y: -amount,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [reduced, speed], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
