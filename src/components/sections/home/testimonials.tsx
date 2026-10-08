"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { BracketGlyph } from "@/components/brand/logo";
import type { TestimonialVM } from "@/lib/data/content";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";

/**
 * Testimonial track on native horizontal scroll (scroll-snap): touch swipes are handled by
 * the browser, mouse users can drag, and prev/next buttons scroll by one card.
 * Quote marks are the brand brackets. Native scrolling mirrors in RTL on its own.
 */
export function Testimonials({ items }: { items: TestimonialVM[] }) {
  const t = useTranslations("home");
  const { isRTL, sign } = useDirection();
  const reduced = usePrefersReducedMotion();
  const track = useRef<HTMLUListElement>(null);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const amount = (card?.offsetWidth ?? 400) + 24;
    // "Next" moves toward the reading end (negative scrollLeft in RTL).
    el.scrollBy({ left: dir * sign * amount, behavior: reduced ? "auto" : "smooth" });
  };

  // Mouse drag-to-scroll (touch and pen keep the browser's native panning).
  const onPointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    const el = track.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
    const startX = e.clientX;
    const start = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = "none";
    const move = (ev: PointerEvent) => {
      el.scrollLeft = start - (ev.clientX - startX);
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.style.scrollSnapType = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up, { once: true });
    el.addEventListener("pointercancel", up, { once: true });
  };

  const Prev = isRTL ? ArrowRight : ArrowLeft;
  const Next = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div>
      <ul
        ref={track}
        onPointerDown={onPointerDown}
        data-cursor="drag"
        className="flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        aria-label={t("testimonialsDrag")}
      >
        {items.map((item) => (
          <li
            key={item.id}
            className="flex w-[min(85vw,28rem)] shrink-0 snap-start flex-col rounded-[var(--radius-brand)] border border-border bg-surface p-7 select-none md:p-9"
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
      </ul>
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
