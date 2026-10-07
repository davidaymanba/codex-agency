"use client";

import { useRef, type ElementType } from "react";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { REVEAL_START } from "@/lib/animation/constants";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { RevealText } from "./reveal-text";

const CODE_CHARS = "{}[]<>/\\_=+*#01";

type ScrambleTextProps = {
  children: string;
  as?: ElementType;
  trigger?: "scroll" | "mount";
  delay?: number;
  duration?: number;
  className?: string;
};

/**
 * Code-like scramble that settles into the real text. LATIN ONLY — in Arabic
 * (or any RTL locale) it falls back to a line mask reveal, since scrambling
 * individual glyphs breaks letter joining.
 */
export function ScrambleText({
  children,
  as: Tag = "span",
  trigger = "scroll",
  delay = 0,
  duration = 1.6,
  className,
}: ScrambleTextProps) {
  const { isRTL } = useDirection();
  if (isRTL) {
    return (
      <RevealText as={Tag} split="lines" trigger={trigger} delay={delay} className={className}>
        {children}
      </RevealText>
    );
  }
  return (
    <LatinScramble
      as={Tag}
      trigger={trigger}
      delay={delay}
      duration={duration}
      className={className}
    >
      {children}
    </LatinScramble>
  );
}

function LatinScramble({
  children,
  as: Tag = "span",
  trigger,
  delay,
  duration,
  className,
}: Required<Pick<ScrambleTextProps, "children" | "trigger" | "delay" | "duration">> &
  Pick<ScrambleTextProps, "as" | "className">) {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      const text = textRef.current;
      if (!el || !text) return;
      const scrollTrigger =
        trigger === "scroll" ? { trigger: el, start: REVEAL_START, once: true } : undefined;

      if (reduced) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, delay, scrollTrigger });
        return;
      }
      gsap.set(el, { opacity: 1 });
      gsap.fromTo(
        text,
        { opacity: 0.35 },
        {
          opacity: 1,
          duration,
          delay,
          ease: "none",
          scrambleText: {
            text: children,
            chars: CODE_CHARS,
            revealDelay: 0.35,
            speed: 0.55,
            tweenLength: false,
          },
          scrollTrigger,
        },
      );
    },
    {
      scope: ref,
      dependencies: [children, reduced, trigger, delay, duration],
      revertOnUpdate: true,
    },
  );

  return (
    <Tag ref={ref} data-reveal className={className}>
      <span className="sr-only">{children}</span>
      <span ref={textRef} aria-hidden>
        {children}
      </span>
    </Tag>
  );
}
