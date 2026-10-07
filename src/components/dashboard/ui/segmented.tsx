"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

/** Segmented control with a shared-layout sliding indicator (view toggles, date ranges). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
  className?: string;
}) {
  const id = useId();
  const reduced = usePrefersReducedMotion();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex border border-border bg-surface p-0.5", className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative h-8 px-3 text-xs font-medium transition-colors duration-150",
              on ? "text-white" : "text-fg-muted hover:text-fg",
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={
                  reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }
                }
                className="absolute inset-0 bg-primary"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5 [&_svg]:size-3.5">
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
