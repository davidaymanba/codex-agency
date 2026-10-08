"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CMark } from "@/components/brand/logo";
import { gsap } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/use-media";

type Phase = "idle" | "covering" | "covered" | "revealing";

/**
 * Block-grid page transition for the public site.
 *
 * Intercepts same-origin <a> clicks at the document level (so every Link gets it for free),
 * covers the screen with a staggered grid of blocks + a flash of the C mark, navigates,
 * then uncovers once the new pathname has rendered. Back/forward, modified clicks,
 * new-tab links, hash links and reduced motion all bypass it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const overlay = useRef<HTMLDivElement>(null);
  const phase = useRef<Phase>("idle");
  const safety = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [grid, setGrid] = useState({ cols: 12, rows: 7 });

  useEffect(() => {
    const measure = () => {
      const cols = window.innerWidth < 768 ? 6 : 12;
      const size = window.innerWidth / cols;
      const rows = Math.ceil(window.innerHeight / size);
      // Phones fire `resize` whenever the browser bar slides in/out while scrolling —
      // only re-render the block grid when it actually changes.
      setGrid((g) => (g.cols === cols && g.rows === rows ? g : { cols, rows }));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const blocks = () => gsap.utils.toArray<HTMLElement>("[data-pt-block]", overlay.current);
  const mark = () => overlay.current?.querySelector<HTMLElement>("[data-pt-mark]");

  // Uncover after the new route has committed.
  useEffect(() => {
    if (phase.current !== "covering" && phase.current !== "covered") return;
    const reveal = () => {
      clearTimeout(safety.current);
      phase.current = "revealing";
      gsap
        .timeline({
          onComplete: () => {
            phase.current = "idle";
            gsap.set(overlay.current, { visibility: "hidden" });
          },
        })
        .to(mark() ?? [], { opacity: 0, scale: 0.8, duration: 0.25, ease: "power2.in" })
        .to(
          blocks(),
          {
            scaleY: 0,
            transformOrigin: "50% 0%",
            duration: 0.5,
            ease: "power3.inOut",
            stagger: { amount: 0.4, grid: [grid.rows, grid.cols], from: "start" },
          },
          0.05,
        );
    };
    // If the cover is still animating, wait for it.
    if (phase.current === "covered") reveal();
    else {
      const check = () => (phase.current === "covered" ? reveal() : requestAnimationFrame(check));
      requestAnimationFrame(check);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (reduced) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page / hash link
      if (url.pathname.includes("/dashboard")) return;
      if (phase.current !== "idle") {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      const href = url.pathname + url.search + url.hash;
      router.prefetch(href);
      phase.current = "covering";
      gsap.set(overlay.current, { visibility: "visible" });
      gsap
        .timeline({
          onComplete: () => {
            phase.current = "covered";
            router.push(href, { scroll: false });
          },
        })
        .fromTo(
          blocks(),
          { scaleY: 0, transformOrigin: "50% 100%" },
          {
            scaleY: 1,
            duration: 0.45,
            ease: "power3.inOut",
            stagger: { amount: 0.35, grid: [grid.rows, grid.cols], from: "start" },
          },
        )
        .fromTo(
          mark() ?? [],
          { opacity: 0, scale: 0.6 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
          "-=0.2",
        );

      // Never leave the user stuck behind the overlay.
      safety.current = setTimeout(() => {
        if (phase.current === "covered" || phase.current === "covering") {
          phase.current = "idle";
          gsap.to(blocks(), { scaleY: 0, duration: 0.3 });
          gsap.set(overlay.current, { visibility: "hidden", delay: 0.3 });
        }
      }, 8000);
    };

    // Capture phase: must run before next/link's own onClick (which navigates immediately).
    // Our preventDefault() makes next/link bail out, and we navigate after the cover.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reduced, router, grid]);

  return (
    <>
      {children}
      <div
        ref={overlay}
        aria-hidden
        className="pointer-events-none invisible fixed inset-0 z-[100]"
      >
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          }}
        >
          {Array.from({ length: grid.cols * grid.rows }, (_, i) => (
            <span
              key={i}
              data-pt-block
              className="bg-primary [outline:1px_solid_var(--color-blue-600)]"
              style={{ transform: "scaleY(0)" }}
            />
          ))}
        </div>
        <div className="absolute inset-0 grid place-items-center">
          <CMark data-pt-mark title={null} className="w-14 text-white opacity-0" />
        </div>
      </div>
    </>
  );
}
