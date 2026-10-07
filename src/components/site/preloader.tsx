"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Logo } from "@/components/brand/logo";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { markPreloaded, PRELOAD_KEY } from "@/lib/animation/preloader";

/**
 * First-visit-per-session preloader (< 2s):
 * blocks of the wordmark assemble → counter 0→100 → the `{ }` brackets fly apart and
 * the page is revealed through the widening gap.
 * Only shown when the head script set `html.preload` (first visit, motion allowed);
 * otherwise it never renders a frame.
 */
export function Preloader() {
  const t = useTranslations("preloader");
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const html = document.documentElement;
      if (!html.classList.contains("preload")) {
        markPreloaded();
        return;
      }
      const el = root.current!;
      const svg = el.querySelector("svg")!;
      const blocks = el.querySelectorAll<SVGPathElement>('[data-part="block"]');
      const left = el.querySelector<SVGPathElement>('[data-side="left"]');
      const right = el.querySelector<SVGPathElement>('[data-side="right"]');
      const count = el.querySelector<HTMLElement>("[data-count]");
      const [panelStart, panelEnd] = el.querySelectorAll<HTMLElement>("[data-panel]");
      // SVG user units per CSS pixel, so brackets can travel half a viewport.
      const unitsPerPx = 921 / svg.getBoundingClientRect().width;
      const fly = (window.innerWidth / 2) * unitsPerPx;
      const counter = { v: 0 };

      const finish = () => {
        html.classList.remove("preload");
        try {
          sessionStorage.setItem(PRELOAD_KEY, "1");
        } catch {}
        gsap.set(el, { display: "none" });
      };

      gsap
        .timeline({ onComplete: finish, defaults: { ease: "expo.out" } })
        .from(blocks, {
          scale: 0,
          transformOrigin: "50% 50%",
          duration: 0.6,
          stagger: { amount: 0.55, from: "random" },
        })
        .from([left, right], { scaleY: 0, transformOrigin: "50% 50%", duration: 0.5 }, 0.15)
        .to(
          counter,
          {
            v: 100,
            duration: 1.05,
            ease: "power2.inOut",
            onUpdate: () => {
              if (count) count.textContent = String(Math.round(counter.v)).padStart(3, "0");
            },
          },
          0,
        )
        .addLabel("open", 1.1)
        .call(markPreloaded, [], "open")
        .to(blocks, { opacity: 0, scale: 0.6, duration: 0.3, ease: "power2.in" }, "open")
        .to(el.querySelector("[data-meta]"), { opacity: 0, duration: 0.2 }, "open")
        .to(left, { x: -fly, duration: 0.8, ease: "expo.inOut" }, "open")
        .to(right, { x: fly, duration: 0.8, ease: "expo.inOut" }, "open")
        .to(panelStart, { xPercent: -100, duration: 0.8, ease: "expo.inOut" }, "open+=0.02")
        .to(panelEnd, { xPercent: 100, duration: 0.8, ease: "expo.inOut" }, "open+=0.02");
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      id="preloader"
      role="status"
      aria-label={t("loading")}
      className="fixed inset-0 z-[120] items-center justify-center"
    >
      {/* Physical halves on purpose: the gap opens from the logo's centre in both directions. */}
      <div data-panel className="absolute inset-y-0 left-0 w-1/2 bg-navy-950" />
      <div data-panel className="absolute inset-y-0 right-0 w-1/2 bg-navy-950" />
      <div className="relative w-[min(70vw,30rem)] text-white">
        <Logo title={null} className="w-full overflow-visible" />
      </div>
      <div
        data-meta
        dir="ltr"
        className="absolute inset-x-0 bottom-8 flex justify-between px-[clamp(1rem,0.5rem+2.5vw,3rem)] label-mono text-indigo-200"
      >
        <span>{"{ codex.init() }"}</span>
        <span>
          <span data-count>000</span>
          <span className="text-blue-400">%</span>
        </span>
      </div>
    </div>
  );
}
