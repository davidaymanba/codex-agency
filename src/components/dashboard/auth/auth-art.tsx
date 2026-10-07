"use client";

import { useRef } from "react";
import { Logo } from "@/components/brand/logo";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/use-media";

const COLS = 10;
const ROWS = 12;

/**
 * Auth split-screen art: a block grid that twinkles in blue while the CODEX wordmark
 * assembles block by block in the middle. Static under reduced motion.
 */
export function AuthArt() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const cells = gsap.utils.toArray<HTMLElement>("[data-cell]", ref.current);
      const parts = ref.current!.querySelectorAll("svg [data-part]");
      gsap.from(parts, {
        scale: 0,
        transformOrigin: "50% 50%",
        duration: 0.6,
        ease: "back.out(1.8)",
        stagger: { amount: 0.8, from: "random" },
        delay: 0.2,
      });
      gsap.from(cells, {
        opacity: 0,
        duration: 0.4,
        stagger: { amount: 0.8, grid: [ROWS, COLS], from: "center" },
      });
      const twinkle = () => {
        const c = cells[Math.floor(Math.random() * cells.length)];
        gsap.fromTo(
          c,
          { backgroundColor: "var(--color-blue-600)" },
          { backgroundColor: "transparent", duration: 1.6, ease: "power2.out" },
        );
      };
      const id = setInterval(twinkle, 260);
      return () => clearInterval(id);
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative grid h-full place-items-center overflow-hidden bg-navy-950"
    >
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span key={i} data-cell className="border-[0.5px] border-indigo-700/30" />
        ))}
      </div>
      <div className="absolute size-[40rem] opacity-60 glow-blue" />
      <div className="relative w-[min(60%,22rem)] text-white">
        <Logo title={null} className="w-full overflow-visible" />
        <p className="mt-6 text-center label-mono text-indigo-200" dir="ltr">
          {"{ dashboard }"}
        </p>
      </div>
    </div>
  );
}
