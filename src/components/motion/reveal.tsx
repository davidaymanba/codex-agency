"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { DURATION, EASE, REVEAL_MARGIN, STAGGER } from "@/lib/animation/constants";
import { onInView } from "@/lib/animation/in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  /** Animate direct children one after another instead of the wrapper as a whole. */
  stagger?: boolean | number;
  y?: number;
  delay?: number;
  trigger?: "scroll" | "mount";
  className?: string;
};

/** Generic fade-up entrance for any block. Guarantees nothing "pops" in. */
export function Reveal({
  children,
  as: Tag = "div",
  stagger = false,
  y = 32,
  delay = 0,
  trigger = "scroll",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (!el) return;
      const mount = trigger === "mount";
      const play = contextSafe!(() => {
        const targets = stagger ? Array.from(el.children) : el;
        gsap.set(el, { opacity: 1 });
        gsap.from(targets, {
          // Above-the-fold (mount) content stays painted for LCP: motion only, no fade from 0.
          opacity: mount ? 1 : 0,
          y: reduced ? 0 : y,
          duration: reduced ? DURATION.fast : DURATION.reveal,
          ease: EASE.out,
          delay,
          stagger: stagger ? (typeof stagger === "number" ? stagger : STAGGER.items) : 0,
        });
      });
      if (mount) {
        play();
        return;
      }
      // Scroll reveals: the tween is only created when the block reaches REVEAL_START.
      const stop = onInView(
        el,
        (entry) => {
          if (!entry.isIntersecting) return;
          stop();
          play();
        },
        REVEAL_MARGIN,
      );
      return stop;
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} data-reveal={trigger === "scroll" ? "" : undefined} className={className}>
      {children}
    </Tag>
  );
}
