"use client";

import { useRef } from "react";
import { LOGO_PARTS } from "@/components/brand/logo";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { onInView } from "@/lib/animation/in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

/**
 * Block-built illustrations for the three service panels. Each one plays when its panel
 * enters the viewport and loops quietly while visible. Final state is static markup,
 * so reduced motion / no-JS still shows a complete picture.
 * They are diagrams of code, grids and charts → always LTR.
 */

function useLoop(build: (tl: gsap.core.Timeline, el: HTMLElement) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (reduced || !el) return;
      // Built lazily (just below the fold) so page load doesn't pay for every illustration;
      // plays while between "top 80%" and "bottom top", like the old ScrollTrigger toggle.
      let tl: gsap.core.Timeline | null = null;
      const ensure = contextSafe!(() => {
        if (!tl) {
          tl = gsap.timeline({
            repeat: -1,
            repeatDelay: 1.6,
            paused: true,
            defaults: { ease: "expo.out" },
          });
          build(tl, el);
        }
        return tl;
      });
      const stopBuild = onInView(el, (e) => e.isIntersecting && ensure(), "0px 0px 25% 0px");
      const stopPlay = onInView(
        el,
        (e) => (e.isIntersecting ? ensure().play() : tl?.pause()),
        "0px 0px -20% 0px",
      );
      return () => {
        stopBuild();
        stopPlay();
      };
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );
  return ref;
}

/* ---------------------------------------------------------------- Development */

const CODE_LINES: { indent: number; parts: [number, string][] }[] = [
  {
    indent: 0,
    parts: [
      [18, "kw"],
      [30, "fn"],
      [8, "punc"],
    ],
  },
  {
    indent: 1,
    parts: [
      [14, "kw"],
      [22, "txt"],
      [26, "str"],
    ],
  },
  {
    indent: 1,
    parts: [
      [20, "kw"],
      [34, "fn"],
      [10, "punc"],
    ],
  },
  {
    indent: 2,
    parts: [
      [28, "txt"],
      [16, "acc"],
    ],
  },
  {
    indent: 2,
    parts: [
      [12, "kw"],
      [36, "str"],
    ],
  },
  { indent: 1, parts: [[8, "punc"]] },
  {
    indent: 1,
    parts: [
      [24, "fn"],
      [18, "txt"],
      [12, "punc"],
    ],
  },
  { indent: 0, parts: [[8, "punc"]] },
];

const tone: Record<string, string> = {
  kw: "bg-blue-300",
  fn: "bg-white",
  txt: "bg-indigo-200/70",
  str: "bg-blue-100/80",
  punc: "bg-indigo-200/50",
  acc: "bg-yellow-500",
};

export function CodeWindowArt({ className }: { className?: string }) {
  const ref = useLoop((tl, el) => {
    const bars = el.querySelectorAll("[data-bar]");
    const caret = el.querySelector("[data-caret]");
    tl.from(bars, {
      scaleX: 0,
      transformOrigin: "0% 50%",
      duration: 0.35,
      ease: "power2.out",
      stagger: 0.07,
    })
      .from(
        el.querySelectorAll("[data-ok]"),
        { opacity: 0, y: 8, duration: 0.5, stagger: 0.1 },
        ">-0.1",
      )
      .to(caret, { opacity: 0, repeat: 5, yoyo: true, duration: 0.25, ease: "steps(1)" }, "<")
      .to(bars, { opacity: 0, duration: 0.4, stagger: 0.02 }, "+=1.2")
      .to(el.querySelectorAll("[data-ok]"), { opacity: 0, duration: 0.3 }, "<");
  });

  return (
    <div ref={ref} dir="ltr" className={cn("w-full max-w-lg", className)}>
      <div className="overflow-hidden rounded-[var(--radius-brand)] border border-white/15 bg-navy-950/45 shadow-[0_40px_80px_-40px_var(--color-navy-950)] backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="size-2.5 bg-white/30" />
          <span className="size-2.5 bg-white/30" />
          <span className="size-2.5 bg-yellow-500" />
          <span className="ms-3 label-mono text-indigo-200">codex/app.ts</span>
        </div>
        <div className="space-y-3 p-5 md:p-6">
          {CODE_LINES.map((line, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-5 text-end label-mono text-indigo-200/50">{i + 1}</span>
              <span
                className="flex flex-1 items-center gap-1.5"
                style={{ paddingInlineStart: `${line.indent * 1.25}rem` }}
              >
                {line.parts.map(([w, k], j) => (
                  <span
                    key={j}
                    data-bar
                    className={cn("block h-2.5", tone[k])}
                    style={{ width: `${w}%` }}
                  />
                ))}
                {i === CODE_LINES.length - 1 && (
                  <span data-caret className="ms-1 block h-3.5 w-1.5 bg-yellow-500" />
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-white/10 px-5 py-3">
          {["build ✓", "tests ✓", "deploy ✓"].map((s) => (
            <span
              key={s}
              data-ok
              className="border border-white/15 px-2 py-1 label-mono text-indigo-200"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Branding */

export function ConstructionArt({ className }: { className?: string }) {
  const ref = useLoop((tl, el) => {
    const lines = el.querySelectorAll("[data-line]");
    const circles = el.querySelectorAll<SVGCircleElement>("[data-circle]");
    const blocks = el.querySelectorAll("[data-block]");
    const notes = el.querySelectorAll("[data-note]");
    tl.from(lines, {
      scaleX: 0,
      scaleY: 0,
      transformOrigin: "50% 50%",
      duration: 0.7,
      stagger: 0.04,
    })
      .from(
        circles,
        { scale: 0, transformOrigin: "50% 50%", opacity: 0, duration: 0.6, stagger: 0.1 },
        "-=0.3",
      )
      .from(
        blocks,
        {
          scale: 0,
          transformOrigin: "50% 50%",
          duration: 0.6,
          ease: "back.out(1.6)",
          stagger: 0.15,
        },
        "-=0.2",
      )
      .from(notes, { opacity: 0, duration: 0.4, stagger: 0.1 }, "-=0.2")
      .to([blocks, circles, notes], { opacity: 0, duration: 0.4 }, "+=1.6")
      .to(lines, { opacity: 0, duration: 0.4 }, "<");
  });

  // C mark (161×162) centred in a 260×260 board with a 38-unit construction grid.
  const grid = [0, 38, 124, 161];
  return (
    <div ref={ref} dir="ltr" className={cn("w-full max-w-md", className)}>
      <svg viewBox="-50 -50 261 262" className="w-full overflow-visible" aria-hidden>
        {grid.map((v) => (
          <g key={v} className="text-border-strong">
            <line
              data-line
              x1={-50}
              x2={211}
              y1={v}
              y2={v}
              stroke="currentColor"
              strokeWidth={0.6}
              strokeDasharray="3 3"
            />
            <line
              data-line
              y1={-50}
              y2={212}
              x1={v}
              x2={v}
              stroke="currentColor"
              strokeWidth={0.6}
              strokeDasharray="3 3"
            />
          </g>
        ))}
        <circle
          data-circle
          cx={38}
          cy={124}
          r={38}
          fill="none"
          stroke="var(--link)"
          strokeWidth={1}
        />
        <circle data-circle cx={38} cy={124} r={2.5} fill="var(--link)" />
        <rect
          data-circle
          x={26}
          y={-12}
          width={24}
          height={24}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1}
        />
        {LOGO_PARTS.c.map((d) => (
          <path key={d} data-block d={d} className="fill-primary dark:fill-white" />
        ))}
        <text data-note x={170} y={22} className="fill-fg-muted font-mono text-[9px]">
          38
        </text>
        <text data-note x={-44} y={150} className="fill-link font-mono text-[9px]">
          r38
        </text>
        <text data-note x={60} y={200} className="fill-fg-muted font-mono text-[9px]">
          161 × 162
        </text>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- Marketing */

const COLUMNS = [2, 3, 3, 5, 4, 7, 9];

export function ChartArt({ className }: { className?: string }) {
  const ref = useLoop((tl, el) => {
    const cols = el.querySelectorAll("[data-col]");
    const line = el.querySelector<SVGPolylineElement>("[data-trend]");
    const len = line?.getTotalLength() ?? 0;
    const count = el.querySelector<HTMLElement>("[data-roas]");
    const state = { v: 0 };
    cols.forEach((col, i) => {
      tl.from(
        col.querySelectorAll("[data-cell]"),
        { scale: 0, duration: 0.35, ease: "back.out(2)", stagger: { each: 0.04, from: "end" } },
        i * 0.12,
      );
    });
    if (line)
      tl.fromTo(
        line,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" },
        0.3,
      );
    tl.fromTo(
      state,
      { v: 0 },
      {
        v: 248,
        duration: 1.4,
        ease: "power3.out",
        onUpdate: () => count && (count.textContent = `+${Math.round(state.v)}%`),
      },
      0.4,
    ).to(
      el.querySelectorAll("[data-cell]"),
      { opacity: 0, duration: 0.3, stagger: 0.005 },
      "+=1.6",
    );
  });

  const max = Math.max(...COLUMNS);
  return (
    <div ref={ref} dir="ltr" className={cn("w-full max-w-lg", className)}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="label-mono text-fg-muted">ROAS · 90d</p>
          <p data-roas className="font-display text-headline font-bold text-link">
            +248%
          </p>
        </div>
        <span className="bg-accent px-2 py-1 label-mono text-accent-fg">↑ growth</span>
      </div>
      <div className="relative">
        <div
          className="grid grid-cols-7 items-end gap-2 md:gap-3"
          style={{ height: `${max * 1.6}rem` }}
        >
          {COLUMNS.map((h, i) => (
            <div key={i} data-col className="flex flex-col-reverse gap-1">
              {Array.from({ length: h }, (_, j) => (
                <span
                  key={j}
                  data-cell
                  className={cn(
                    "block w-full",
                    j === h - 1 && i === COLUMNS.length - 1
                      ? "bg-accent"
                      : j === h - 1
                        ? "bg-link"
                        : "bg-primary/70",
                  )}
                  style={{ height: "1.35rem" }}
                />
              ))}
            </div>
          ))}
        </div>
        <svg
          viewBox="0 0 700 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
          aria-hidden
        >
          <polyline
            data-trend
            points={COLUMNS.map((h, i) => `${i * 100 + 50},${100 - (h / max) * 100}`).join(" ")}
            fill="none"
            stroke="var(--fg)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
