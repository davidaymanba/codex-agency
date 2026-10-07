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

/** Scroll-scrubbed vertical drift. Halved on small screens, off under reduced motion. */
export function ParallaxLayer({ children, speed = 0.2, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
        const amount = speed * (ctx.conditions?.mobile ? 50 : 100);
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
