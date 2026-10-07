"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/use-media";

/**
 * Scroll choreography for the sticky service cards (desktop only): as card N+1 rides up
 * over card N, card N scales back and dims. Transform + opacity only.
 */
export function ServicesStack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-service-card]", ref.current);
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          const panel = card.firstElementChild as HTMLElement;
          const shade = card.querySelector("[data-card-shade]");
          const st = { trigger: next, start: "top bottom", end: "top 25%", scrub: true };
          gsap.to(panel, { scale: 0.92, ease: "none", scrollTrigger: st });
          gsap.to(shade, { opacity: 0.35, ease: "none", scrollTrigger: st });
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className="space-y-6 md:space-y-[12vh]">
      {children}
    </div>
  );
}
