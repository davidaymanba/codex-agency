import { ArrowUpRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { SolutionIcon } from "@/components/sections/home/solutions";
import { PageHero } from "@/components/sections/pages/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSolutions, type SolutionVM } from "@/lib/data/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/solutions">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.solutions" });
  return pageMetadata({ locale, path: "/solutions", title: t("label"), description: t("intro") });
}

function SolutionBlock({ item, cta }: { item: SolutionVM; cta: string }) {
  return (
    <li id={item.slug} className="scroll-mt-28">
      <TiltCard max={4} className="h-full rounded-[var(--radius-brand)]">
        <article className="flex h-full flex-col rounded-[var(--radius-brand)] border border-border bg-surface p-7 md:p-10">
          <div className="flex items-start justify-between gap-6">
            <SolutionIcon item={item} />
            <span className="label-mono text-fg-muted" dir="ltr">{`{ ${item.slug} }`}</span>
          </div>
          <h3 className="mt-10 font-display text-headline font-bold">{item.title}</h3>
          <p className="mt-3 max-w-xl text-lead text-fg-muted">{item.description}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {item.features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center bg-primary text-white">
                  <Check aria-hidden className="size-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            data-cursor="open"
            className="group mt-auto inline-flex items-center gap-2 pt-10 font-medium text-link"
          >
            <span className="border-b border-current/40 pb-0.5 group-hover:border-current">
              {cta}
            </span>
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100"
            />
          </Link>
        </article>
      </TiltCard>
    </li>
  );
}

export default async function SolutionsPage({ params }: PageProps<"/[locale]/solutions">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.solutions");
  const tc = await getTranslations("common");
  const items = await getSolutions(locale);
  const solutions = items.filter((s) => s.kind === "solution");
  const platforms = items.filter((s) => s.kind === "platform");

  return (
    <>
      <PageHero label={t("label")} title={t("title")} intro={t("intro")}>
        <nav aria-label={t("label")} className="mt-10 flex flex-wrap gap-2">
          {items.map((s) => (
            <a
              key={s.slug}
              href={`#${s.slug}`}
              data-no-transition
              className="border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:bg-primary hover:text-white"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </PageHero>
      <section aria-labelledby="sol-title" className="container-x py-16 md:py-24">
        <SectionHeading
          id="sol-title"
          index="01"
          label={t("solutionsTitle")}
          title={t("solutionsTitle")}
          className="mb-12"
        />
        <Reveal as="ul" stagger className="grid gap-6 lg:grid-cols-2">
          {solutions.map((s) => (
            <SolutionBlock key={s.slug} item={s} cta={tc("startProject")} />
          ))}
        </Reveal>
      </section>
      <section aria-labelledby="plat-title" className="container-x pb-24 md:pb-36">
        <SectionHeading
          id="plat-title"
          index="02"
          label={t("platformsTitle")}
          title={t("platformsTitle")}
          className="mb-12"
        />
        <Reveal as="ul" stagger className="grid gap-6 lg:grid-cols-3">
          {platforms.map((s) => (
            <SolutionBlock key={s.slug} item={s} cta={tc("startProject")} />
          ))}
        </Reveal>
      </section>
    </>
  );
}
