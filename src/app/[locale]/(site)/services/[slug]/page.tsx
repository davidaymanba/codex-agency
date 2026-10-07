import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/sections/home/project-card";
import {
  ChartArt,
  CodeWindowArt,
  ConstructionArt,
} from "@/components/sections/home/service-illustrations";
import { FaqList } from "@/components/sections/pages/faq-list";
import { PageHero } from "@/components/sections/pages/page-hero";
import { MagneticButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  getProject,
  getProjects,
  getService,
  getServices,
  getServiceSlugs,
  getTeams,
} from "@/lib/data/content";
import { jsonLd, pageMetadata } from "@/lib/seo";

const ART = { code: CodeWindowArt, construction: ConstructionArt, chart: ChartArt } as const;

export async function generateStaticParams() {
  return (await getServiceSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/[slug]">): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  const s = await getService(locale, slug);
  if (!s) return {};
  return pageMetadata({
    locale,
    path: `/services/${slug}`,
    title: s.title,
    description: s.description,
  });
}

export default async function ServicePage({ params }: PageProps<"/[locale]/services/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const service = await getService(locale, slug);
  if (!service) notFound();

  const t = await getTranslations("common");
  const [all, teams, projects] = await Promise.all([
    getServices(locale),
    getTeams(locale),
    getProjects(locale),
  ]);
  const team = teams.find((x) => x.slug === service.slug)!;
  const details = await Promise.all(projects.map((p) => getProject(locale, p.slug)));
  const related = projects
    .filter((_, i) => details[i]?.services.some((s) => s.slug === service.slug))
    .slice(0, 2);
  const others = all.filter((s) => s.slug !== service.slug);
  const Art = ART[service.illustration];
  const isDev = service.illustration === "code";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd([
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.description,
            provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
            areaServed: ["EG", "SA", "AE", "KW", "OM"],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: service.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ])}
      />
      <PageHero
        index={service.index}
        label={service.tagline}
        title={service.title}
        intro={service.description}
        aside={
          <div
            className={
              isDev
                ? "rounded-[var(--radius-brand)] bg-primary p-6 md:p-10"
                : "rounded-[var(--radius-brand)] border border-border bg-surface p-6 md:p-10"
            }
          >
            <Art className="mx-auto" />
          </div>
        }
      >
        <div className="mt-10">
          <MagneticButton href="/contact" size="lg" cursor="open">
            {t("startProject")}
          </MagneticButton>
        </div>
      </PageHero>

      <section aria-labelledby="what-title" className="container-x py-20 md:py-28">
        <SectionHeading
          id="what-title"
          index="01"
          label={t("whatWeDo")}
          title={service.tagline}
          className="mb-12"
        />
        <Reveal
          as="ul"
          stagger
          className="grid gap-px overflow-hidden rounded-[var(--radius-brand)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
        >
          {service.subServices.map((sub, i) => (
            <li
              key={sub}
              className="group flex min-h-40 flex-col justify-between bg-surface p-6 transition-colors duration-300 hover:bg-surface-2"
            >
              <span
                className="label-mono text-fg-muted"
                dir="ltr"
              >{`{ ${String(i + 1).padStart(2, "0")} }`}</span>
              <span className="text-title font-medium">{sub}</span>
            </li>
          ))}
        </Reveal>
      </section>

      <section
        aria-labelledby="team-title"
        className="border-y border-border bg-surface/50 py-20 md:py-28"
      >
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading id="team-title" index="02" label={t("theTeam")} title={team.name} />
          </div>
          <Reveal className="lg:col-span-7">
            <p className="text-lead text-fg-muted">{team.description}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {team.deliverables.map((d) => (
                <li key={d} className="bg-primary px-3 py-2 text-sm text-white">
                  {d}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-x py-20 md:py-28">
          <SectionHeading
            id="related-title"
            index="03"
            label={t("relatedWork")}
            title={t("relatedWork")}
            className="mb-12"
          />
          <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2">
            {related.map((p) => (
              <li key={p.slug}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="faq-title" className="container-x py-20 md:py-28">
        <SectionHeading
          id="faq-title"
          index="04"
          label="FAQ"
          title={t("faqTitle")}
          className="mb-12"
        />
        <FaqList items={service.faqs} />
      </section>

      <section aria-labelledby="others-title" className="container-x pb-24">
        <h2 id="others-title" className="mb-6 label-mono text-fg-muted">
          {t("otherServices")}
        </h2>
        <Reveal stagger className="grid gap-4 md:grid-cols-2">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/services/${o.slug}`}
              data-cursor="open"
              className="group flex items-center justify-between rounded-[var(--radius-brand)] border border-border p-6 transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-white md:p-8"
            >
              <span>
                <span className="block label-mono opacity-70" dir="ltr">{`{ ${o.index} }`}</span>
                <span className="mt-2 block font-display text-headline font-bold">{o.title}</span>
              </span>
              <ArrowUpRight
                aria-hidden
                className="size-8 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 rtl:-scale-x-100"
              />
            </Link>
          ))}
        </Reveal>
      </section>
    </>
  );
}
