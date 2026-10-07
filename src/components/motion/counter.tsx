"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { REVEAL_START } from "@/lib/animation/constants";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

// Western digits in both languages (brief §4).
const fmt = new Intl.NumberFormat("en-US");

type CounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

/** Counts up from 0 when scrolled into view. SSR/no-JS shows the final value. */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  duration = 2,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const final = `${prefix}${fmt.format(value)}${suffix}`;

  useGSAP(
    () => {
      const num = numRef.current;
      if (reduced || !num) return;
      const state = { v: 0 };
      num.textContent = `${prefix}0${suffix}`;
      gsap.to(state, {
        v: value,
        duration,
        ease: "power3.out",
        onUpdate: () => {
          num.textContent = `${prefix}${fmt.format(Math.round(state.v))}${suffix}`;
        },
        scrollTrigger: { trigger: ref.current, start: REVEAL_START, once: true },
      });
    },
    { scope: ref, dependencies: [value, reduced], revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={cn("tabular-nums", className)} dir="ltr">
      <span className="sr-only">{final}</span>
      <span ref={numRef} aria-hidden>
        {final}
      </span>
    </span>
  );
}
