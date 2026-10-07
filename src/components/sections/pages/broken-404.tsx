"use client";

import { RotateCcw } from "lucide-react";
import { useRef } from "react";
import { BracketGlyph } from "@/components/brand/logo";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/use-media";

// 5×7 block glyphs.
const GLYPHS: Record<string, string[]> = {
  "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  "0": ["11111", "10001", "10001", "10001", "10001", "10001", "11111"],
};
const CELL = 10;
const GAP = 1.2;

/**
 * `{ 404 }` built from blocks: assembles, then a chunk of blocks breaks loose and
 * falls apart. "Rebuild" snaps them back. Static under reduced motion.
 */
export function Broken404({ rebuildLabel }: { rebuildLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const fall = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (reduced) return;
      const cells = gsap.utils.toArray<SVGRectElement>("[data-cell]", ref.current);
      const loose = cells.filter((_, i) => (i * 7919) % 10 < 4); // deterministic ~40%
      gsap.from(cells, {
        scale: 0,
        transformOrigin: "50% 50%",
        duration: 0.5,
        ease: "back.out(2)",
        stagger: { amount: 0.6, from: "random" },
      });
      fall.current = gsap.timeline({ delay: 1.5 }).to(loose, {
        y: () => gsap.utils.random(120, 260),
        x: () => gsap.utils.random(-30, 30),
        rotation: () => gsap.utils.random(-120, 120),
        opacity: 0.25,
        transformOrigin: "50% 50%",
        duration: 1.1,
        ease: "bounce.out",
        stagger: { amount: 0.8, from: "random" },
      });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  const digits = "404".split("");
  const width = digits.length * 5 * CELL + (digits.length - 1) * CELL * 1.5;

  return (
    <div ref={ref} className="flex flex-col items-start gap-6">
      <div dir="ltr" className="flex items-center gap-[2vw] text-link">
        <BracketGlyph side="left" className="h-[clamp(5rem,14vw,11rem)] text-fg" />
        <svg
          viewBox={`0 0 ${width} ${7 * CELL}`}
          className="h-[clamp(4rem,11vw,9rem)] w-auto overflow-visible"
          role="img"
          aria-label="404"
        >
          {digits.map((d, di) =>
            GLYPHS[d].flatMap((row, r) =>
              row
                .split("")
                .map((bit, c) =>
                  bit === "1" ? (
                    <rect
                      key={`${di}-${r}-${c}`}
                      data-cell
                      x={di * (5 * CELL + CELL * 1.5) + c * CELL + GAP / 2}
                      y={r * CELL + GAP / 2}
                      width={CELL - GAP}
                      height={CELL - GAP}
                      fill="currentColor"
                    />
                  ) : null,
                ),
            ),
          )}
        </svg>
        <BracketGlyph side="right" className="h-[clamp(5rem,14vw,11rem)] text-fg" />
      </div>
      {!reduced && (
        <button
          type="button"
          onClick={() => fall.current?.timeScale(2).reverse()}
          className="inline-flex items-center gap-2 label-mono text-fg-muted hover:text-link"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          {rebuildLabel}
        </button>
      )}
    </div>
  );
}
