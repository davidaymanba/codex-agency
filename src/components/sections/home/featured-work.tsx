"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ProjectCategoryVM, ProjectVM } from "@/lib/data/content";
import { gsap, useGSAP } from "@/lib/animation/gsap";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";

type Filter = "all" | ProjectVM["category"];

/**
 * Featured projects with filter chips; switching filters pops the new cards in.
 * Covers pixel-reveal on scroll; hover shows tags and the cursor turns into a "View" block.
 * (GSAP only — keeps the `motion` library out of the home page bundle.)
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
  const list = useRef<HTMLUListElement>(null);
  const changed = useRef(false);
  const shown = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: t("workAll") },
    ...categories.map((c) => ({ key: c.slug, label: c.name })),
  ];

  useGSAP(
    () => {
      // Only animate after a filter click, never on mount (cards are already visible).
      if (!changed.current || reduced) return;
      gsap.from(list.current!.children, {
        opacity: 0,
        scale: 0.96,
        duration: 0.4,
        ease: "power3.out",
        stagger: 0.05,
      });
    },
    { scope: list, dependencies: [filter], revertOnUpdate: true },
  );

  const select = (key: Filter) => {
    changed.current = true;
    setFilter(key);
  };

  return (
    <>
      <div role="group" aria-label={t("workLabel")} className="mb-10 flex flex-wrap gap-2">
        {chips.map((c) => {
          const on = filter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => select(c.key)}
              className={cn(
                "h-10 border px-4 text-sm font-medium transition-colors duration-200",
                on
                  ? "border-transparent bg-primary text-primary-fg"
                  : "border-border text-fg hover:border-border-strong",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <ul ref={list} className="grid gap-x-6 gap-y-12 md:grid-cols-2">
        {shown.map((p, i) => (
          <li key={p.slug} className={cn(i % 2 === 1 && "md:mt-24")}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="py-16 text-center text-fg-muted">{t("workEmpty")}</p>}
    </>
  );
}
