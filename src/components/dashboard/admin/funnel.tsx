"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/hooks/use-media";

/**
 * Funnel as aligned bars (one hue, widths relative to the first step) with absolute values
 * and step-to-step conversion in text — never colour alone.
 */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const t = useTranslations("dash.analytics");
  const ofPrev = (pct: number) => t("ofPrev", { pct: String(pct) });
  const reduced = usePrefersReducedMotion();
  const max = Math.max(1, steps[0]?.value ?? 1);
  const fmt = new Intl.NumberFormat("en-US");
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => {
        const pct =
          i === 0
            ? null
            : steps[i - 1].value
              ? Math.round((s.value / steps[i - 1].value) * 1000) / 10
              : 0;
        return (
          <li key={s.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span>
                <span className="me-2 label-mono text-fg-muted" dir="ltr">{`0${i + 1}`}</span>
                {s.label}
              </span>
              <span className="font-medium tabular-nums" dir="ltr">
                {fmt.format(s.value)}
              </span>
            </div>
            <div className="h-7 bg-surface-2">
              <motion.div
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full origin-left bg-link rtl:origin-right"
                style={{ width: `${Math.max(1.5, (s.value / max) * 100)}%` }}
              />
            </div>
            {pct !== null && <p className="mt-1 text-xs text-fg-muted">{ofPrev(pct)}</p>}
          </li>
        );
      })}
    </ol>
  );
}
