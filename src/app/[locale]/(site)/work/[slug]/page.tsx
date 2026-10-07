import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { BlockReveal } from "@/components/motion/block-reveal";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { ProjectCover } from "@/components/sections/home/project-cover";
import { ButtonLink } from "@/components/ui/button";
import { CodeLabel } from "@/components/ui/code-label";
import { RichText } from "@/components/ui/rich-text";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getProject, getProjectSlugs } from "@/lib/data/content";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getProjectSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  const p = await getProject(locale, slug);
  if (!p) return {};
  return pageMetadata({
    locale,
    path: `/work/${slug}`,
    title: p.seoTitle ?? p.title,
    description: p.seoDescription ?? p.summary,
    type: "article",
  });
}

export default async function CaseStudyPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const p = await getProject(locale, slug);
  if (!p) notFound();
  const t = await getTranslations("common");

  const meta = [
    [t("client"), p.client],
    [t("year"), String(p.year)],
    [t("servicesUsed"), p.services.map((s) => s.title).join(" · ")],
  ] as const;

  return (
    <article>
      {p.draft && (
        <p
          role="status"
          className="fixed inset-x-0 bottom-0 z-50 bg-yellow-500 py-2 text-center text-sm font-medium text-navy-950"
        >
          Draft preview — not visible to visitors
        </p>
      )}
      <header className="container-x pt-[calc(var(--header-h)+4rem)] pb-12 md:pt-[calc(var(--header-h)+6rem)]">
        <Reveal trigger="mount">
          <CodeLabel className="mb-6">{p.categoryName}</CodeLabel>
        </Reveal>
        <RevealText
          as="h1"
          trigger="mount"
          className="max-w-5xl font-display text-display font-bold"
        >
          {p.title}
        </RevealText>
        <Reveal trigger="mount" delay={0.2}>
          <p className="mt-6 max-w-3xl text-lead text-fg-muted">{p.summary}</p>
          <dl className="mt-10 grid gap-6 border-t border-border pt-6 sm:grid-cols-3">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt className="label-mono text-fg-muted">{k}</dt>
                <dd className="mt-1 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </header>

      <div className="container-x">
        <BlockReveal
          cols={14}
          rows={8}
          trigger="mount"
          delay={0.3}
          className="relative aspect-[16/9] rounded-[var(--radius-brand)]"
        >
          <ProjectCover project={{ ...p, label: p.client }} priority />
        </BlockReveal>
      </div>

      <section className="container-x grid gap-12 py-20 md:grid-cols-2 md:py-28">
        <Reveal>
          <h2 className="label-mono text-link">{t("challenge")}</h2>
          <p className="mt-4 text-title">{p.challenge}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="label-mono text-link">{t("approach")}</h2>
          <p className="mt-4 text-title">{p.approach}</p>
        </Reveal>
      </section>

      {p.content && (
        <section className="container-x max-w-3xl pb-16 text-lead">
          <RichText doc={p.content} />
        </section>
      )}

      {p.gallery.length > 0 && (
        <section aria-label="Gallery" className="container-x grid gap-4 pb-20 md:grid-cols-2">
          {p.gallery.map((src, i) => (
            <div
              key={src}
              className={
                i % 3 === 0
                  ? "relative aspect-[16/9] overflow-hidden rounded-[var(--radius-brand)] md:col-span-2"
                  : "relative aspect-[4/3] overflow-hidden rounded-[var(--radius-brand)]"
              }
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </section>
      )}

      <section
        aria-labelledby="results-title"
        className="border-y border-border bg-surface/50 py-20 md:py-28"
      >
        <div className="container-x">
          <h2 id="results-title" className="mb-10 label-mono text-fg-muted">
            {t("results")}
          </h2>
          <Reveal as="dl" stagger className="grid gap-10 md:grid-cols-3">
            {p.results.map((r) => (
              <div key={r.label} className="flex flex-col-reverse border-t-2 border-primary pt-6">
                <dt className="mt-2 text-fg-muted">{r.label}</dt>
                <dd className="font-display text-display font-bold text-link" dir="ltr">
                  {r.value}
                </dd>
              </div>
            ))}
          </Reveal>
          <ul className="mt-12 flex flex-wrap gap-2">
            {p.tags.map((tag) => (
              <li key={tag} className="border border-border px-3 py-1.5 label-mono">
                {tag}
              </li>
            ))}
          </ul>
          {p.liveUrl && (
            <ButtonLink href={p.liveUrl} variant="secondary" className="mt-10">
              {t("visitSite")}
            </ButtonLink>
          )}
        </div>
      </section>

      {p.next && (
        <Link
          href={`/work/${p.next.slug}`}
          data-cursor="view"
          className="group block border-b border-border"
        >
          <div className="container-x flex items-center justify-between gap-6 py-16 md:py-24">
            <div>
              <p className="label-mono text-fg-muted">{t("nextProject")}</p>
              <p className="mt-3 font-display text-headline font-bold transition-colors group-hover:text-link">
                {p.next.title}
              </p>
            </div>
            <span className="grid size-16 shrink-0 place-items-center border border-border transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
              <ArrowUpRight aria-hidden className="size-6 rtl:-scale-x-100" />
            </span>
          </div>
        </Link>
      )}
    </article>
  );
}
