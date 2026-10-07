"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/animation/gsap";
import { useFinePointer, usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

const LABEL_KEYS = ["view", "drag", "open"] as const;
type LabelKey = (typeof LABEL_KEYS)[number];

/**
 * Desktop-only block cursor. Grows into a labelled block over `[data-cursor="view|drag|open"]`,
 * enlarges over any other interactive element, and stays out of the way on text fields.
 * Not rendered on touch devices or with reduced motion.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  if (!fine || reduced) return null;
  return <BlockCursor />;
}

function BlockCursor() {
  const t = useTranslations("cursor");
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "hover" | "label" | "text" | "hidden">("hidden");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");
    const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      xTo(e.clientX);
      yTo(e.clientY);
      setState((s) => (s === "hidden" ? "idle" : s));
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      const key = labelled?.dataset.cursor;
      if (key) {
        setLabel(LABEL_KEYS.includes(key as LabelKey) ? t(key as LabelKey) : key);
        setState("label");
        return;
      }
      setLabel(null);
      if (target?.closest("input, textarea, select, [contenteditable='true']")) setState("text");
      else if (target?.closest("a, button, [role='button'], label, summary")) setState("hover");
      else setState("idle");
    };
    const onLeave = () => setState("hidden");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [t]);

  return (
    <div
      ref={ref}
      aria-hidden
      // Physical `left` on purpose: pointer coordinates are physical in both directions.
      className="pointer-events-none fixed top-0 left-0 z-[110]"
    >
      <div
        className={cn(
          "grid -translate-x-1/2 -translate-y-1/2 place-items-center transition-[width,height,opacity,background-color,border-color] duration-300 ease-[var(--ease-expo-out)]",
          state === "hidden" && "opacity-0",
          state === "idle" && "size-2.5 bg-link",
          state === "hover" && "size-10 border border-link bg-transparent",
          state === "text" && "size-1.5 bg-link opacity-60",
          state === "label" && "size-20 bg-primary text-white",
        )}
      >
        {state === "label" && label && <span className="label-mono text-white">{label}</span>}
      </div>
    </div>
  );
}
