"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

/** Underline tabs with a shared-layout indicator. `errors` marks tabs that contain invalid fields. */
export function FormTabs<T extends string>({
  value,
  onChange,
  tabs,
  errors = [],
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string }[];
  errors?: T[];
}) {
  const id = useId();
  const reduced = usePrefersReducedMotion();
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const on = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex h-11 items-center gap-2 px-4 text-sm whitespace-nowrap transition-colors",
              on ? "text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
            {errors.includes(tab.value) && (
              <span aria-label="has errors" className="size-1.5 bg-yellow-500" />
            )}
            {on && (
              <motion.span
                layoutId={`tab-${id}`}
                transition={
                  reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }
                }
                className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
