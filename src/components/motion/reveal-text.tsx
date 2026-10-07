"use client";

import { useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/animation/gsap";
import { DURATION, EASE, REVEAL_START, STAGGER } from "@/lib/animation/constants";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

export type RevealSplit = "lines" | "words" | "chars";

type RevealTextProps = {
  children: string;
  as?: ElementType;
  /** Requested granularity. Arabic never splits below words (keeps letters joined). */
  split?: RevealSplit;
  trigger?: "scroll" | "mount";
  delay?: number;
  stagger?: number;
  className?: string;
  id?: string;
};

/**
 * Masked text reveal. Lines/words slide up out of a line mask.
 * Content is server-rendered and only hidden when JS is present (`data-reveal`).
 */
export function RevealText({
  children,
  as: Tag = "p",
  split = "lines",
  trigger = "scroll",
  delay = 0,
  stagger,
  className,
  id,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const { locale } = useDirection();
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (reduced && trigger === "mount") return; // visible as rendered
      if (reduced) {
        const scrollTrigger =
          trigger === "scroll" ? { trigger: el, start: REVEAL_START, once: true } : undefined;
        gsap.fromTo(
          el,
          { opacity: 0 },
          { opacity: 1, duration: DURATION.fast, delay, scrollTrigger },
        );
        return;
      }

      const mode: RevealSplit = locale === "ar" && split === "chars" ? "words" : split;
      const type =
        mode === "lines" ? "lines" : mode === "words" ? "words,lines" : "chars,words,lines";

      // Split lazily: the (layout-heavy) split runs only when the heading approaches the
      // viewport, so off-screen headings cost nothing during page load.
      const run = () => {
        gsap.set(el, { opacity: 1 });
        // Split only the visual copy (aria-hidden); screen readers read the intact sr-only text.
        SplitText.create(textRef.current!, {
          type,
          mask: "lines",
          autoSplit: true,
          aria: "none",
          onSplit(self) {
            const targets =
              mode === "lines" ? self.lines : mode === "words" ? self.words : self.chars;
            return gsap.from(targets, {
              yPercent: 115,
              rotate: mode === "chars" ? 4 : 0,
              duration: DURATION.reveal,
              ease: EASE.out,
              delay,
              stagger: stagger ?? STAGGER[mode],
            });
          },
        });
      };
      if (trigger === "scroll") {
        ScrollTrigger.create({ trigger: el, start: REVEAL_START, once: true, onEnter: run });
      } else {
        // Above the fold (often the LCP): never hide it — lines rise and sharpen while visible.
        const split = SplitText.create(textRef.current!, { type: "lines", aria: "none" });
        gsap.from(split.lines, {
          y: 26,
          filter: "blur(8px)",
          duration: DURATION.reveal,
          ease: EASE.out,
          delay,
          stagger: stagger ?? STAGGER.lines,
        });
      }
    },
    { scope: ref, dependencies: [locale, reduced, split, trigger, delay], revertOnUpdate: true },
  );

  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={trigger === "scroll" ? "" : undefined}
      className={cn(className)}
    >
      <span className="sr-only">{children}</span>
      <span ref={textRef} aria-hidden className="block">
        {children}
      </span>
    </Tag>
  );
}
