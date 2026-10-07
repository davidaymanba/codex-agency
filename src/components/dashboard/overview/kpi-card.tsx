"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { animate, useInView, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

/** KPI tile: label, count-up hero number, trend badge (icon + sign, never colour alone). */
export function KpiCard({
  label,
  value,
  format,
  delta,
  deltaSuffix = "%",
  deltaLabel,
}: {
  label: string;
  value: number;
  format: "number" | "percent" | "currency";
  delta?: number;
  deltaSuffix?: string;
  deltaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = usePrefersReducedMotion();
  const mv = useMotionValue(0);
  const [shown, setShown] = useState(0);
  useMotionValueEvent(mv, "change", (v) => setShown(v));

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, value, reduced, mv]);

  const fmt = (n: number) =>
    format === "currency"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(n)
      : format === "percent"
        ? `${Math.round(n)}%`
        : new Intl.NumberFormat("en-US").format(Math.round(n));

  const Trend =
    delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-[var(--radius-brand)] border border-border bg-surface p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong"
    >
      <span
        aria-hidden
        className="absolute end-0 top-0 size-2.5 bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
      <p className="text-xs font-medium text-fg-muted">{label}</p>
      <p className="mt-3 font-display text-[2rem] leading-none font-bold tabular-nums" dir="ltr">
        <span className="sr-only">{fmt(value)}</span>
        <span aria-hidden>{fmt(shown)}</span>
      </p>
      {delta !== undefined && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-muted">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-1.5 py-0.5 font-medium",
              delta > 0
                ? "bg-blue-100 text-blue-600 dark:bg-blue-600/25 dark:text-blue-300"
                : delta < 0
                  ? "bg-yellow-200 text-navy-950 dark:bg-yellow-500/20 dark:text-yellow-400"
                  : "bg-surface-2",
            )}
            dir="ltr"
          >
            <Trend aria-hidden className="size-3" />
            {delta > 0 ? "+" : ""}
            {delta}
            {deltaSuffix}
          </span>
          {deltaLabel}
        </p>
      )}
    </div>
  );
}
