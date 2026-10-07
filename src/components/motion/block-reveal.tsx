"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { REVEAL_START } from "@/lib/animation/constants";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

type BlockRevealProps = {
  children: ReactNode;
  cols?: number;
  rows?: number;
  /** Block color while covering. `bg` = page background (content "pixels in"). */
  tone?: "bg" | "primary" | "surface";
  order?: "random" | "start" | "center" | "edges";
  trigger?: "scroll" | "mount";
  delay?: number;
  className?: string;
};

const toneClass = { bg: "bg-bg", primary: "bg-primary", surface: "bg-surface-2" } as const;

/**
 * Pixel/block reveal: a grid of blocks covers the content and drops away block by block.
 * The overlay only exists when JS is present (`.js-blocks`), so content is never trapped.
 * Grid flow follows `dir`, so "start" order mirrors in RTL automatically.
 */
export function BlockReveal({
  children,
  cols = 8,
  rows = 5,
  tone = "bg",
  order = "random",
  trigger = "scroll",
  delay = 0,
  className,
}: BlockRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const cells = gsap.utils.toArray<HTMLElement>("[data-cell]", ref.current);
      const scrollTrigger =
        trigger === "scroll"
          ? { trigger: ref.current, start: REVEAL_START, once: true }
          : undefined;
      if (reduced) {
        gsap.to(cells, { opacity: 0, duration: 0.5, delay, scrollTrigger });
        return;
      }
      gsap.to(cells, {
        scale: 0,
        duration: 0.55,
        ease: "power3.inOut",
        delay,
        stagger: { each: 0.9 / (cols * rows), from: order, grid: [rows, cols] },
        scrollTrigger,
      });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {children}
      <div
        aria-hidden
        className="js-blocks pointer-events-none absolute inset-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: cols * rows }, (_, i) => (
          <span key={i} data-cell className={cn("block scale-[1.02]", toneClass[tone])} />
        ))}
      </div>
    </div>
  );
}
