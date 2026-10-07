"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import type { TeamVM } from "@/lib/data/content";
import { cn } from "@/lib/utils";

/** Each team gets its own accent from the palette (yellow stays a small strip only). */
const ACCENT: Record<TeamVM["slug"], { strip: string; chip: string }> = {
  development: { strip: "bg-blue-600", chip: "bg-blue-600 text-white" },
  branding: { strip: "bg-yellow-500", chip: "bg-yellow-500 text-navy-950" },
  marketing: { strip: "bg-blue-400", chip: "bg-blue-400 text-navy-950" },
};

/**
 * Desktop: three columns, the hovered/focused one expands and reveals deliverables.
 * Mobile: an accordion (same state, button-driven).
 */
export function Teams({ teams }: { teams: TeamVM[] }) {
  const t = useTranslations("home");
  const [active, setActive] = useState(0);

  return (
    <Reveal as="ul" stagger className="flex flex-col gap-3 lg:h-[34rem] lg:flex-row">
      {teams.map((team, i) => {
        const on = active === i;
        const accent = ACCENT[team.slug];
        return (
          <li
            key={team.slug}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            className={cn(
              "relative flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-brand)] border border-border bg-surface transition-[flex-grow,border-color] duration-700 ease-[var(--ease-expo-out)] motion-reduce:transition-none lg:flex-1",
              on && "border-border-strong lg:flex-[2.2]",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 top-0 h-1.5 origin-left transition-transform duration-700 rtl:origin-right",
                accent.strip,
                on ? "scale-x-100" : "scale-x-25",
              )}
            />
            <button
              type="button"
              aria-expanded={on}
              aria-controls={`team-${team.slug}`}
              onClick={() => setActive(i)}
              className="flex w-full items-start justify-between gap-4 p-6 text-start md:p-8"
            >
              <span>
                <span className="label-mono text-fg-muted" dir="ltr">{`{ 0${i + 1} }`}</span>
                <span className="mt-4 block font-display text-headline font-bold">{team.name}</span>
              </span>
              <Plus
                aria-hidden
                className={cn(
                  "mt-1 size-6 shrink-0 transition-transform duration-500 lg:hidden",
                  on && "rotate-45",
                )}
              />
            </button>
            <div
              id={`team-${team.slug}`}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-expo-out)] lg:mt-auto lg:grid-rows-[1fr]",
                on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 lg:opacity-100",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="px-6 pb-6 md:px-8 md:pb-8">
                  <p className="max-w-md text-fg-muted">{team.description}</p>
                  <div
                    className={cn(
                      "transition-opacity duration-500 lg:delay-150",
                      on ? "opacity-100" : "lg:opacity-0",
                    )}
                  >
                    <p className="mt-6 label-mono text-fg-muted">{t("teamsDelivers")}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {team.deliverables.map((d) => (
                        <li
                          key={d}
                          className={cn("px-3 py-1.5 text-sm", on ? accent.chip : "bg-surface-2")}
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </Reveal>
  );
}
