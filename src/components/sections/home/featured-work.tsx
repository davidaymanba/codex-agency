"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ProjectCategoryVM, ProjectVM } from "@/lib/data/content";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";

type Filter = "all" | ProjectVM["category"];

/**
 * Featured projects with animated filter chips (shared-layout indicator) and layout
 * transitions between filters. Covers pixel-reveal on scroll; hover shows tags and the
 * cursor turns into a "View" block.
 */
export function FeaturedWork({
  projects,
  categories,
}: {
  projects: ProjectVM[];
  categories: ProjectCategoryVM[];
}) {
  const t = useTranslations("home");
  const reduced = usePrefersReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: t("workAll") },
    ...categories.map((c) => ({ key: c.slug, label: c.name })),
  ];
  const spring = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 34 };

  return (
    <>
      <LayoutGroup id="work-filters">
        <div role="group" aria-label={t("workLabel")} className="mb-10 flex flex-wrap gap-2">
          {chips.map((c) => {
            const on = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(c.key)}
                className={cn(
                  "relative h-10 border px-4 text-sm font-medium transition-colors duration-200",
                  on
                    ? "border-transparent text-primary-fg"
                    : "border-border text-fg hover:border-border-strong",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="work-chip"
                    transition={spring}
                    className="absolute inset-0 -z-10 bg-primary"
                  />
                )}
                <span className="relative">{c.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <motion.ul layout={!reduced} className="grid gap-x-6 gap-y-12 md:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p, i) => (
            <motion.li
              key={p.slug}
              layout={!reduced}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={spring}
              className={cn(i % 2 === 1 && "md:mt-24")}
            >
              <ProjectCard project={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {shown.length === 0 && <p className="py-16 text-center text-fg-muted">{t("workEmpty")}</p>}
    </>
  );
}
