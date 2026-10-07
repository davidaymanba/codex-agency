import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import type { ServiceVM } from "@/lib/data/content";
import { cn } from "@/lib/utils";
import { ChartArt, CodeWindowArt, ConstructionArt } from "./service-illustrations";
import { ServicesStack } from "./services-stack";

const ART = { code: CodeWindowArt, construction: ConstructionArt, chart: ChartArt } as const;

/** Card surfaces: Development is the bold blue moment, then surface → tint. */
const SURFACE = [
  "bg-primary text-white [--card-muted:var(--color-blue-100)]",
  "bg-surface text-fg [--card-muted:var(--fg-muted)]",
  "bg-surface-2 text-fg [--card-muted:var(--fg-muted)]",
];

/**
 * Pinned stacking panels: each service card sticks under the header and the next one
 * slides over it while the previous scales back (desktop). Mobile: a plain list.
 */
export async function Services({
  items,
  heading = true,
}: {
  items: ServiceVM[];
  heading?: boolean;
}) {
  const t = await getTranslations("home");

  return (
    <section
      id="services"
      aria-labelledby={heading ? "services-title" : undefined}
      className="container-x scroll-mt-24 py-24 md:py-36"
    >
      {heading && (
        <SectionHeading
          id="services-title"
          index="01"
          label={t("servicesLabel")}
          title={t("servicesTitle")}
          intro={t("servicesIntro")}
          className="mb-14 md:mb-20"
        />
      )}

      <ServicesStack>
        {items.map((s, i) => {
          const Art = ART[s.illustration];
          return (
            <article
              key={s.slug}
              data-service-card
              aria-labelledby={`svc-${s.slug}`}
              className="md:sticky md:h-[min(78vh,44rem)]"
              style={{ top: `calc(5.5rem + ${i * 1.5}rem)` }}
            >
              <Reveal
                y={60}
                className={cn(
                  "relative grid h-full origin-top gap-10 overflow-hidden rounded-[var(--radius-brand)] p-7 will-change-transform md:grid-cols-2 md:p-12",
                  SURFACE[i % SURFACE.length],
                )}
              >
                <div data-card-inner className="flex flex-col">
                  <p className="label-mono text-[var(--card-muted)]" dir="ltr">
                    {`{ ${s.index} }`}
                  </p>
                  <h3 id={`svc-${s.slug}`} className="mt-6 font-display text-display font-bold">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-title font-medium">{s.tagline}</p>
                  <p className="mt-5 max-w-md text-[var(--card-muted)]">{s.description}</p>
                  <ul className="mt-8 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {s.subServices.map((sub) => (
                      <li key={sub} className="flex items-center gap-2 text-[0.9375rem]">
                        <span aria-hidden className="size-1.5 shrink-0 bg-current opacity-60" />
                        {sub}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/services/${s.slug}`}
                    data-cursor="open"
                    className="group mt-auto inline-flex items-center gap-2 pt-10 font-medium"
                  >
                    <span className="border-b border-current/40 pb-0.5 transition-colors group-hover:border-current">
                      {t("servicesExplore", { service: s.title })}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                    />
                  </Link>
                </div>
                <div className="flex items-center justify-center">
                  <Art />
                </div>
                <div
                  data-card-shade
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-navy-950 opacity-0"
                />
              </Reveal>
            </article>
          );
        })}
      </ServicesStack>
    </section>
  );
}
