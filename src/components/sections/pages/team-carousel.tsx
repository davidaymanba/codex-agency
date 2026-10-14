"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Avatar } from "@/components/dashboard/ui/primitives";
import { useDirection } from "@/hooks/use-direction";
import { usePrefersReducedMotion } from "@/hooks/use-media";

type Member = { id: string; name: string; role: string; photo: string | null };

const AUTOPLAY_MS = 3500;
/** Autoplay waits this long after the visitor last touched the row or an arrow. */
const IDLE_MS = 6000;

/**
 * Team grid on md+, endless swipe row on mobile. The list is rendered three times
 * (originals first so the desktop stagger is unaffected; copies are md:hidden + aria-hidden).
 * The row sits on the middle copy, and whenever scrolling settles on the first or last copy
 * it jumps by one set width to the identical card — so after the last card comes the first
 * again (and before the first, the last). Rect deltas keep every jump correct in RTL.
 * Autoplay advances one card at a time while the row is on screen and the visitor is idle.
 */
export function TeamCarousel({ members }: { members: Member[] }) {
  const t = useTranslations("pages.about");
  const { isRTL } = useDirection();
  const reduced = usePrefersReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const stepRef = useRef<(dir: 1 | -1) => void>(() => {});
  const lastInput = useRef(0);
  const n = members.length;
  const loop = n > 1;

  useEffect(() => {
    const ul = wrap.current?.firstElementChild as HTMLElement | null;
    if (!ul || !loop) return;
    const cards = () => Array.from(ul.children) as HTMLElement[];
    const scrollable = () => ul.scrollWidth > ul.clientWidth;
    const centred = () => {
      const r = ul.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      let best = 0;
      let dist = Infinity;
      cards().forEach((c, i) => {
        const b = c.getBoundingClientRect();
        const d = Math.abs(b.left + b.width / 2 - mid);
        if (d < dist) [best, dist] = [i, d];
      });
      return best;
    };
    /** Physical distance from card `from` to card `to` (negative = towards the left). */
    const delta = (from: number, to: number) => {
      const c = cards();
      return c[to].getBoundingClientRect().left - c[from].getBoundingClientRect().left;
    };
    const jump = (from: number, to: number) => {
      ul.style.scrollBehavior = "auto";
      ul.scrollLeft += delta(from, to);
      ul.style.scrollBehavior = "";
    };
    const settle = () => {
      if (!scrollable()) return;
      const i = centred();
      if (i < n) jump(i, i + n);
      else if (i >= 2 * n) jump(i, i - n);
    };
    stepRef.current = (dir) => {
      if (!scrollable()) return;
      settle();
      const i = centred();
      ul.scrollBy({ left: delta(i, i + dir), behavior: reduced ? "auto" : "smooth" });
    };

    // (Re)centre on the middle copy whenever the row becomes scrollable — e.g. the page was
    // opened wide and then narrowed to phone width, or the device was rotated.
    let wasScrollable = false;
    const sync = () => {
      const now = scrollable();
      if (now && !wasScrollable) jump(centred(), n);
      wasScrollable = now;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(ul);

    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, 140); // fallback for browsers without `scrollend`
    };
    const touched = () => (lastInput.current = Date.now());
    ul.addEventListener("scrollend", settle);
    ul.addEventListener("scroll", onScroll, { passive: true });
    ul.addEventListener("pointerdown", touched, { passive: true });
    ul.addEventListener("touchstart", touched, { passive: true });
    ul.addEventListener("wheel", touched, { passive: true });

    // Autoplay: only while the row is visible, the tab is active and nobody is interacting.
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.5 });
    io.observe(ul);
    const auto = reduced
      ? undefined
      : setInterval(() => {
          if (visible && !document.hidden && Date.now() - lastInput.current > IDLE_MS) stepRef.current(1);
        }, AUTOPLAY_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(auto);
      ro.disconnect();
      io.disconnect();
      ul.removeEventListener("scrollend", settle);
      ul.removeEventListener("scroll", onScroll);
      ul.removeEventListener("pointerdown", touched);
      ul.removeEventListener("touchstart", touched);
      ul.removeEventListener("wheel", touched);
    };
  }, [n, loop, reduced]);

  const press = (dir: 1 | -1) => {
    lastInput.current = Date.now();
    stepRef.current(dir);
  };

  const sets = loop ? [0, 1, 2] : [0];
  const Prev = isRTL ? ArrowRight : ArrowLeft;
  const Next = isRTL ? ArrowLeft : ArrowRight;
  const arrow =
    "grid size-12 place-items-center border border-border transition-colors hover:border-primary hover:bg-primary hover:text-white";

  return (
    <div ref={wrap}>
      {/* Mobile: full-bleed row; each card is 2/3 of the screen and snaps to the centre,
          so a quarter of the neighbouring cards peeks in on both sides. */}
      <Reveal
        as="ul"
        stagger
        className="-mx-[clamp(1rem,0.5rem+2.5vw,3rem)] flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[calc((100vw-(100vw-1.5rem)/1.5)/2)] [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden"
      >
        {sets.flatMap((set) =>
          members.map((m) => (
            <li
              key={`${set}-${m.id}`}
              aria-hidden={set > 0 || undefined}
              className={`group w-[calc((100vw-1.5rem)/1.5)] shrink-0 snap-center md:w-auto${set > 0 ? " md:hidden" : ""}`}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-brand)] bg-surface-2">
                {m.photo ? (
                  // next/image serves AVIF/WebP at the displayed size (uploads are multi-MB originals).
                  <Image
                    src={m.photo}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 67vw"
                    // Portrait team photos: keep heads in frame when cropping.
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <Avatar name={m.name} className="size-full text-headline" />
                )}
              </div>
              <p className="mt-3 font-medium">{m.name}</p>
              <p className="text-sm text-fg-muted">{m.role}</p>
            </li>
          )),
        )}
      </Reveal>
      {loop && (
        <div className="mt-6 flex justify-center gap-2 md:hidden">
          <button type="button" onClick={() => press(-1)} aria-label={t("peoplePrev")} className={arrow}>
            <Prev aria-hidden className="size-5" />
          </button>
          <button type="button" onClick={() => press(1)} aria-label={t("peopleNext")} className={arrow}>
            <Next aria-hidden className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
