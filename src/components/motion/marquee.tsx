"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/animation/gsap";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

type MarqueeProps = {
  children: ReactNode;
  /** Seconds for one full loop at rest. */
  duration?: number;
  /** Move against the reading direction. */
  reverse?: boolean;
  /** Speed up with scroll velocity. */
  velocity?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  trackClassName?: string;
};

/**
 * Infinite marquee. Content is rendered twice and the track loops by 50%.
 * In RTL the travel direction mirrors (sign flips). Static under reduced motion.
 */
export function Marquee({
  children,
  duration = 30,
  reverse = false,
  velocity = true,
  pauseOnHover = false,
  className,
  trackClassName,
}: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { sign } = useDirection();
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !trackRef.current) return;
      // The track holds two copies (2W). LTR is anchored left and travels 0 → -50%;
      // RTL is anchored right and travels 0 → +50%. Both keep the viewport covered and
      // loop seamlessly. `reverse` plays the same path backwards.
      const end = -50 * sign;
      const [from, to] = reverse ? [end, 0] : [0, end];
      const tween = gsap.fromTo(
        trackRef.current,
        { xPercent: from },
        { xPercent: to, duration, ease: "none", repeat: -1 },
      );

      if (velocity) {
        const settle = gsap.quickTo(tween, "timeScale", { duration: 0.8, ease: "power3.out" });
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 5);
            tween.timeScale(boost);
            settle(1);
          },
        });
      }

      if (pauseOnHover && ref.current) {
        const el = ref.current;
        const pause = () => gsap.to(tween, { timeScale: 0, duration: 0.4 });
        const play = () => gsap.to(tween, { timeScale: 1, duration: 0.4 });
        el.addEventListener("pointerenter", pause);
        el.addEventListener("pointerleave", play);
        return () => {
          el.removeEventListener("pointerenter", pause);
          el.removeEventListener("pointerleave", play);
        };
      }
    },
    { scope: ref, dependencies: [reduced, sign, reverse, duration], revertOnUpdate: true },
  );

  // Reduced motion: one static row the user can swipe (wrapping turned two rows into a
  // screen-tall column on phones).
  if (reduced) {
    return (
      <div
        className={cn(
          "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className,
        )}
      >
        <div className={cn("flex w-max items-center", trackClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <div ref={trackRef} className="flex w-max will-change-transform">
        <div className={cn("flex shrink-0 items-center", trackClassName)}>{children}</div>
        <div aria-hidden className={cn("flex shrink-0 items-center", trackClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
