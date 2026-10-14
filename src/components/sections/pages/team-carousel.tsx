"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Avatar } from "@/components/dashboard/ui/primitives";

type Member = { id: string; name: string; role: string; photo: string | null };

/**
 * Team grid on md+, endless swipe row on mobile. The list is rendered three times
 * (originals first so the desktop stagger is unaffected; copies are md:hidden + aria-hidden).
 * The row starts on the middle copy, and whenever scrolling settles on the first or last
 * copy it jumps by one set width to the identical card — so after the last card comes the
 * first again, in both directions. Rect deltas keep the jump correct in RTL too.
 */
export function TeamCarousel({ members }: { members: Member[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const n = members.length;
  const loop = n > 1;

  useEffect(() => {
    const ul = wrap.current?.firstElementChild as HTMLElement | null;
    if (!ul || !loop) return;
    const cards = () => Array.from(ul.children) as HTMLElement[];
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
    const jump = (from: number, to: number) => {
      const c = cards();
      ul.style.scrollBehavior = "auto";
      ul.scrollLeft += c[to].getBoundingClientRect().left - c[from].getBoundingClientRect().left;
      ul.style.scrollBehavior = "";
    };

    // Only the mobile row scrolls; on md+ the copies are hidden and nothing overflows.
    if (ul.scrollWidth <= ul.clientWidth) return;
    jump(centred(), n);

    const settle = () => {
      const i = centred();
      if (i < n) jump(i, i + n);
      else if (i >= 2 * n) jump(i, i - n);
    };
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, 140); // fallback for browsers without `scrollend`
    };
    ul.addEventListener("scrollend", settle);
    ul.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      ul.removeEventListener("scrollend", settle);
      ul.removeEventListener("scroll", onScroll);
    };
  }, [n, loop]);

  const sets = loop ? [0, 1, 2] : [0];

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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photo}
                    alt=""
                    loading={set > 0 ? "lazy" : undefined}
                    // Portrait team photos: keep heads in frame when cropping.
                    className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
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
    </div>
  );
}
