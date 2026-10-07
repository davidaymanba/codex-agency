"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { animate, motion, useMotionValue } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BracketGlyph } from "@/components/brand/logo";
import type { TestimonialVM } from "@/lib/data/content";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";

/**
 * Draggable testimonial track with prev/next buttons. Quote marks are the brand brackets.
 * Drag bounds and button direction mirror in RTL (the track overflows to the left there).
 */
export function Testimonials({ items }: { items: TestimonialVM[] }) {
  const t = useTranslations("home");
  const { isRTL, sign } = useDirection();
  const reduced = usePrefersReducedMotion();
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const x = useMotionValue(0);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!viewport.current || !track.current) return;
      setOverflow(Math.max(0, track.current.scrollWidth - viewport.current.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    return () => ro.disconnect();
  }, [items.length]);

  const constraints = isRTL ? { left: 0, right: overflow } : { left: -overflow, right: 0 };

  const step = (dir: 1 | -1) => {
    const card = track.current?.firstElementChild as HTMLElement | null;
    const amount = (card?.offsetWidth ?? 400) + 24;
    // "Next" moves content toward the reading start.
    const target = x.get() - dir * sign * amount;
    const clamped = Math.min(constraints.right, Math.max(constraints.left, target));
    animate(
      x,
      clamped,
      reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 },
    );
  };

  const Prev = isRTL ? ArrowRight : ArrowLeft;
  const Next = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div>
      <div ref={viewport} className="overflow-hidden" data-cursor="drag">
        <motion.ul
          ref={track}
          drag={overflow > 0 ? "x" : false}
          dragConstraints={constraints}
          dragElastic={0.12}
          style={{ x }}
          className="flex w-max cursor-grab gap-6 active:cursor-grabbing"
          aria-label={t("testimonialsDrag")}
        >
          {items.map((item) => (
            <li
              key={item.id}
              className="flex w-[min(85vw,28rem)] flex-col rounded-[var(--radius-brand)] border border-border bg-surface p-7 select-none md:p-9"
            >
              <span aria-hidden dir="ltr" className="flex gap-4 text-[2rem] leading-none text-link">
                <BracketGlyph side="left" />
                <BracketGlyph side="right" />
              </span>
              <blockquote className="mt-6 flex-1 text-lead">
                <p>{item.quote}</p>
              </blockquote>
              <footer className="mt-8 flex items-center gap-4 border-t border-border pt-6">
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center bg-primary font-medium text-white"
                >
                  {item.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{item.name}</span>
                  <span className="block truncate text-sm text-fg-muted">
                    {item.role}, {item.company}
                  </span>
                </span>
                <span className="ms-auto label-mono text-fg-muted">{item.country}</span>
              </footer>
            </li>
          ))}
        </motion.ul>
      </div>
      <div className="mt-8 flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={t("testimonialsPrev")}
          className="grid size-12 place-items-center border border-border transition-colors hover:border-primary hover:bg-primary hover:text-white"
        >
          <Prev aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={t("testimonialsNext")}
          className="grid size-12 place-items-center border border-border transition-colors hover:border-primary hover:bg-primary hover:text-white"
        >
          <Next aria-hidden className="size-5" />
        </button>
        <p className="ms-4 label-mono text-fg-muted">{t("testimonialsDrag")}</p>
      </div>
    </div>
  );
}
