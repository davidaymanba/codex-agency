"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { useSpringPointer } from "./use-spring-pointer";

type TiltCardProps = {
  children: ReactNode;
  /** Max rotation in degrees. */
  max?: number;
  /** Blue glow border that follows the cursor. */
  glow?: boolean;
  className?: string;
};

/**
 * 3D tilt on hover + cursor-following glow border (CSS vars, no re-renders, no library).
 * Children can use `group-hover:` (the card is a `group`).
 */
export function TiltCard({ children, max = 8, glow = true, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const active = fine && !reduced;
  const tilt = useSpringPointer((rx, ry) => {
    if (ref.current)
      ref.current.style.transform =
        rx || ry ? `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)` : "";
  }, 0.14);

  const onMove = (e: PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    if (active) tilt((0.5 - py) * 2 * max, (px - 0.5) * 2 * max);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => active && tilt(0, 0)}
      className={cn("group relative isolate", className)}
    >
      {children}
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-300 [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), var(--glow), transparent 65%)",
          }}
        />
      )}
    </div>
  );
}
