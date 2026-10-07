"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { REVEAL_START } from "@/lib/animation/constants";
import { BracketGlyph } from "@/components/brand/logo";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

type BracketFrameProps = {
  children: ReactNode;
  /**
   * view   — brackets start closed and open around the content on scroll.
   * hover  — brackets slide in when an ancestor with class `group` is hovered/focused.
   * static — always shown.
   */
  mode?: "view" | "hover" | "static";
  /** `logo` = the brand bracket shape, `mono` = typed `{ }` characters. */
  variant?: "logo" | "mono";
  className?: string;
  bracketClassName?: string;
  delay?: number;
};

/**
 * Frames content in `{ }`. The frame is forced LTR so the brackets can never
 * flip into `} {` in Arabic; the content keeps the page direction.
 */
export function BracketFrame({
  children,
  mode = "view",
  variant = "logo",
  className,
  bracketClassName,
  delay = 0,
}: BracketFrameProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { dir } = useDirection();
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (mode !== "view" || !ref.current) return;
      const root = ref.current;
      const [left, right] = gsap.utils.toArray<HTMLElement>("[data-bracket]", root);
      const content = root.querySelector<HTMLElement>("[data-bracket-content]");
      const half = (content?.offsetWidth ?? 0) / 2;
      const scrollTrigger = { trigger: root, start: REVEAL_START, once: true };
      gsap.set(root, { opacity: 1 });
      if (reduced) {
        gsap.from(root, { opacity: 0, duration: 0.6, delay, scrollTrigger });
        return;
      }
      const tl = gsap.timeline({
        delay,
        scrollTrigger,
        defaults: { ease: "expo.inOut", duration: 1 },
      });
      tl.from(left, { x: half }, 0)
        .from(right, { x: -half }, 0)
        .from(content, { opacity: 0, scale: 0.92, duration: 0.8, ease: "expo.out" }, 0.45);
    },
    { scope: ref, dependencies: [reduced, mode], revertOnUpdate: true },
  );

  const hover =
    mode === "hover"
      ? "opacity-0 transition-[opacity,translate] duration-300 ease-[var(--ease-expo-out)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
      : "";

  const bracket = (side: "left" | "right") =>
    variant === "logo" ? (
      <BracketGlyph
        side={side}
        data-bracket={side}
        className={cn(
          "h-[0.9em] shrink-0 text-link",
          hover,
          mode === "hover" && (side === "left" ? "translate-x-[0.4em]" : "-translate-x-[0.4em]"),
          bracketClassName,
        )}
      />
    ) : (
      <span
        aria-hidden
        data-bracket={side}
        className={cn(
          "inline-block shrink-0 font-mono text-link",
          hover,
          mode === "hover" && (side === "left" ? "translate-x-[0.4em]" : "-translate-x-[0.4em]"),
          bracketClassName,
        )}
      >
        {side === "left" ? "{" : "}"}
      </span>
    );

  return (
    <span
      ref={ref}
      dir="ltr"
      data-reveal={mode === "view" ? "" : undefined}
      className={cn("inline-flex items-center gap-[0.3em]", className)}
    >
      {bracket("left")}
      <span dir={dir} data-bracket-content className="inline-block">
        {children}
      </span>
      {bracket("right")}
    </span>
  );
}
