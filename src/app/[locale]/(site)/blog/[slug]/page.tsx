import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { BlockReveal } from "@/components/motion/block-reveal";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { ProjectCover } from "@/components/sections/home/project-cover";
import { CodeLabel } from "@/components/ui/code-label";
import { RichText } from "@/components/ui/rich-text";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPost, getPosts, getPostSlugs } from "@/lib/data/content";
import { jsonLd, pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  const post = await getPost(locale, slug);
  if (!post) return {};
  return pageMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    type: "article",
  });
}

export default async function PostPage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const post = await getPost(locale, slug);
  if (!post) notFound();
  const t = await getTranslations("common");
  const format = await getFormatter();
  const more = (await getPosts(locale)).filter((p) => p.slug !== slug).slice(0, 2);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <article>
      {post.draft && (
        <p
          role="status"
          className="fixed inset-x-0 bottom-0 z-50 bg-yellow-500 py-2 text-center text-sm font-medium text-navy-950"
        >
          Draft preview — not visible to visitors
        </p>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          inLanguage: locale,
          author: { "@type": "Organization", name: post.author },
          publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          mainEntityOfPage: `${siteConfig.url}/${locale}/blog/${slug}`,
        })}
      />
      <header className="container-x max-w-4xl pt-[calc(var(--header-h)+3rem)] pb-12 md:pt-[calc(var(--header-h)+5rem)]">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 label-mono text-fg-muted hover:text-link"
        >
          <Back aria-hidden className="size-3.5" />
          {t("backToBlog")}
        </Link>
        <Reveal trigger="mount" className="mt-10">
          <CodeLabel>{post.tags[0]}</CodeLabel>
        </Reveal>
        <RevealText as="h1" trigger="mount" className="mt-6 font-display text-headline font-bold">
          {post.title}
        </RevealText>
        <Reveal trigger="mount" delay={0.2}>
          <p className="mt-6 text-lead text-fg-muted">{post.excerpt}</p>
          <p className="mt-8 label-mono text-fg-muted">
            {post.author} ·{" "}
            <time dateTime={post.date} dir="ltr">
              {format.dateTime(new Date(post.date), { dateStyle: "long", numberingSystem: "latn" })}
            </time>{" "}
            · {t("minRead", { n: post.minutes })}
          </p>
        </Reveal>
      </header>
      <div className="container-x max-w-6xl">
        <BlockReveal
          cols={12}
          rows={6}
          trigger="mount"
          delay={0.3}
          className="relative aspect-[21/9] rounded-[var(--radius-brand)]"
        >
          <ProjectCover project={post} priority />
        </BlockReveal>
      </div>
      <Reveal className="container-x max-w-3xl py-16 text-lead md:py-24">
        <RichText doc={post.content} />
      </Reveal>
      {more.length > 0 && (
        <aside aria-labelledby="more-title" className="border-t border-border py-16 md:py-24">
          <div className="container-x">
            <h2 id="more-title" className="mb-8 label-mono text-fg-muted">
              {t("keepReading")}
            </h2>
            <ul className="grid gap-6 md:grid-cols-2">
              {more.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/blog/${m.slug}`}
                    data-cursor="open"
                    className="group block rounded-[var(--radius-brand)] border border-border p-6 transition-colors hover:border-primary md:p-8"
                  >
                    <p className="label-mono text-fg-muted">{t("minRead", { n: m.minutes })}</p>
                    <p className="mt-3 text-title font-medium transition-colors group-hover:text-link">
                      {m.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </article>
  );
}
