"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { useSpringPointer } from "./use-spring-pointer";

type MagneticProps = {
  children: ReactNode;
  /** 0–1: how far the element follows the pointer. */
  strength?: number;
  className?: string;
};

/**
 * Wrap any interactive element to make it magnetic: it leans toward the pointer and springs
 * back on leave. Inert on touch devices and under reduced motion. Library-free (rAF spring).
 */
export function Magnetic({ children, strength = 0.35, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const active = fine && !reduced;
  const move = useSpringPointer((x, y) => {
    if (ref.current) ref.current.style.transform = x || y ? `translate3d(${x}px, ${y}px, 0)` : "";
  });

  const onMove = (e: PointerEvent) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    move(
      (e.clientX - (r.left + r.width / 2)) * strength,
      (e.clientY - (r.top + r.height / 2)) * strength,
    );
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => active && move(0, 0)}
      className={cn("inline-block", className)}
    >
      {children}
    </span>
  );
}
