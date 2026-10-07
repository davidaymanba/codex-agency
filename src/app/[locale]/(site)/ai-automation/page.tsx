import { Bell, Bot, Database, FileText, Headset, ListChecks, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { AiAutomation } from "@/components/sections/home/ai-automation";
import { ProjectCard } from "@/components/sections/home/project-card";
import { PageHero } from "@/components/sections/pages/page-hero";
import { MagneticButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Locale } from "@/i18n/routing";
import { getProjects } from "@/lib/data/content";
import { pageMetadata } from "@/lib/seo";

const WHAT = [
  ["support", Headset],
  ["leads", ListChecks],
  ["orders", PackageCheck],
  ["content", FileText],
  ["data", Database],
  ["alerts", Bell],
] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/ai-automation">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.ai" });
  return pageMetadata({
    locale,
    path: "/ai-automation",
    title: t("label"),
    description: t("intro"),
  });
}

export default async function AiPage({ params }: PageProps<"/[locale]/ai-automation">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.ai");
  const tc = await getTranslations("common");
  const projects = (await getProjects(locale)).filter((p) => p.category === "ai");

  return (
    <>
      <PageHero
        label={t("label")}
        title={t("title")}
        intro={t("intro")}
        aside={
          <div className="grid aspect-square max-w-sm place-items-center rounded-[var(--radius-brand)] bg-navy-950 text-blue-400 lg:ms-auto">
            <Bot aria-hidden className="size-1/3" strokeWidth={1.2} />
          </div>
        }
      >
        <div className="mt-10">
          <MagneticButton href="/contact" size="lg" cursor="open">
            {tc("startProject")}
          </MagneticButton>
        </div>
      </PageHero>

      <AiAutomation heading={false} />

      <section aria-labelledby="what-title" className="container-x py-20 md:py-28">
        <SectionHeading
          id="what-title"
          index="01"
          label={t("whatTitle")}
          title={t("whatTitle")}
          className="mb-12"
        />
        <Reveal as="ul" stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT.map(([key, Icon]) => (
            <li
              key={key}
              className="group flex items-center gap-4 rounded-[var(--radius-brand)] border border-border bg-surface p-5 transition-colors hover:border-primary"
            >
              <span className="grid size-12 shrink-0 place-items-center bg-surface-2 text-link transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="font-medium">{t(`what.${key}`)}</span>
            </li>
          ))}
        </Reveal>
      </section>

      <section
        aria-labelledby="why-title"
        className="border-y border-border bg-surface/50 py-20 md:py-28"
      >
        <div className="container-x">
          <SectionHeading
            id="why-title"
            index="02"
            label={t("whyTitle")}
            title={t("whyTitle")}
            className="mb-12"
          />
          <Reveal as="ul" stagger className="grid gap-8 md:grid-cols-3">
            {(["real", "bilingual", "owned"] as const).map((k, i) => (
              <li key={k} className="border-t-2 border-primary pt-6">
                <span className="label-mono text-fg-muted" dir="ltr">{`0${i + 1}`}</span>
                <h3 className="mt-3 text-title font-medium">{t(`why.${k}.title`)}</h3>
                <p className="mt-2 text-fg-muted">{t(`why.${k}.body`)}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {projects.length > 0 && (
        <section aria-labelledby="ai-work" className="container-x py-20 md:py-28">
          <SectionHeading
            id="ai-work"
            index="03"
            label={tc("relatedWork")}
            title={tc("relatedWork")}
            className="mb-12"
          />
          <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2">
            {projects.map((p) => (
              <li key={p.slug}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
