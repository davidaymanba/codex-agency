import {
  ArrowUpRight,
  Boxes,
  Contact,
  GraduationCap,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BracketFrame } from "@/components/motion/bracket-frame";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import type { SolutionVM } from "@/lib/data/content";

const ICONS: Record<string, LucideIcon> = {
  "shopping-bag": ShoppingBag,
  "graduation-cap": GraduationCap,
  boxes: Boxes,
  contact: Contact,
};

export function SolutionIcon({ item }: { item: Pick<SolutionVM, "icon" | "brandPath"> }) {
  const Icon = item.icon ? (ICONS[item.icon] ?? Sparkles) : null;
  return (
    <span className="relative grid size-14 place-items-center border border-border text-link transition-[border-color,background-color,color] duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
      {/* corner notch — the logo's cut block */}
      <span
        aria-hidden
        className="absolute -start-px -top-px size-2.5 bg-surface transition-colors duration-300 group-hover:bg-surface"
      />
      <span className="transition-transform duration-500 ease-[var(--ease-expo-out)] group-hover:-translate-y-0.5 group-hover:rotate-[-8deg]">
        {Icon ? (
          <Icon aria-hidden className="size-6" strokeWidth={1.6} />
        ) : item.brandPath ? (
          <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-current">
            <path d={item.brandPath} />
          </svg>
        ) : null}
      </span>
    </span>
  );
}

/** Solutions grid: tilt + cursor glow border, brackets slide around titles, staggered entrance. */
export async function Solutions({ items }: { items: SolutionVM[] }) {
  const t = await getTranslations("home");

  return (
    <section aria-labelledby="solutions-title" className="container-x pb-24 md:pb-36">
      <SectionHeading
        id="solutions-title"
        index="02"
        label={t("solutionsLabel")}
        title={t("solutionsTitle")}
        intro={t("solutionsIntro")}
        className="mb-14 md:mb-20"
      />

      <Reveal as="ul" stagger={0.07} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.slug}>
            <TiltCard className="h-full rounded-[var(--radius-brand)]">
              <Link
                href={`/solutions#${item.slug}`}
                data-cursor="open"
                className="flex h-full min-h-[17rem] flex-col rounded-[var(--radius-brand)] border border-border bg-surface p-6 transition-colors duration-300 hover:border-transparent"
              >
                <div className="flex items-start justify-between">
                  <SolutionIcon item={item} />
                  <span className="label-mono text-fg-muted" dir="ltr">
                    {`{ ${item.kind === "platform" ? t("kindPlatform") : t("kindSolution")} }`}
                  </span>
                </div>
                <h3 className="mt-auto pt-10 text-title font-medium">
                  <BracketFrame
                    mode="hover"
                    variant="mono"
                    className="-ms-[1.1em] gap-1.5"
                    bracketClassName="text-link"
                  >
                    {item.title}
                  </BracketFrame>
                </h3>
                <p className="mt-3 text-[0.9375rem] text-fg-muted">{item.description}</p>
              </Link>
            </TiltCard>
          </li>
        ))}

        <li>
          <Link
            href="/contact"
            data-cursor="open"
            className="group relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-[var(--radius-brand)] bg-primary p-6 text-white"
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-grid opacity-30 [--grid-line:color-mix(in_oklab,var(--color-white)_18%,transparent)] [--grid-size:32px]"
            />
            <span className="relative label-mono text-blue-100" dir="ltr">
              {"{ custom }"}
            </span>
            <h3 className="relative mt-auto pt-10 text-title font-medium">{t("customTitle")}</h3>
            <p className="relative mt-3 text-[0.9375rem] text-blue-100">{t("customBody")}</p>
            <span className="relative mt-6 inline-flex items-center gap-2 font-medium">
              {t("customCta")}
              <ArrowUpRight
                aria-hidden
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100"
              />
            </span>
          </Link>
        </li>
      </Reveal>
    </section>
  );
}
