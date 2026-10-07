import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { BlockReveal } from "@/components/motion/block-reveal";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCover } from "@/components/sections/home/project-cover";
import { PageHero } from "@/components/sections/pages/page-hero";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPosts } from "@/lib/data/content";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.blog" });
  return pageMetadata({ locale, path: "/blog", title: t("label"), description: t("intro") });
}

export default async function BlogPage({ params }: PageProps<"/[locale]/blog">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.blog");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const posts = await getPosts(locale);

  return (
    <>
      <PageHero label={t("label")} title={t("title")} intro={t("intro")} />
      <section aria-label={t("label")} className="container-x pb-24 md:pb-36">
        {posts.length === 0 ? (
          <p className="py-16 text-center text-fg-muted">{t("empty")}</p>
        ) : (
          <Reveal as="ul" stagger className="grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <li key={post.slug} className={cn(i === 0 && "md:col-span-2 lg:col-span-3")}>
                <Link
                  href={`/blog/${post.slug}`}
                  data-cursor="open"
                  className={cn(
                    "group grid gap-6",
                    i === 0 && "lg:grid-cols-2 lg:items-center lg:gap-12",
                  )}
                >
                  <BlockReveal
                    cols={10}
                    rows={6}
                    className={cn(
                      "relative rounded-[var(--radius-brand)]",
                      i === 0 ? "aspect-[16/10]" : "aspect-[4/3]",
                    )}
                  >
                    <div className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-expo-out)] group-hover:scale-[1.04]">
                      <ProjectCover project={post} />
                    </div>
                  </BlockReveal>
                  <div>
                    <p className="label-mono text-fg-muted">
                      <time dateTime={post.date} dir="ltr">
                        {format.dateTime(new Date(post.date), {
                          dateStyle: "medium",
                          numberingSystem: "latn",
                        })}
                      </time>
                      {" · "}
                      {tc("minRead", { n: post.minutes })}
                    </p>
                    <h2
                      className={cn(
                        "mt-3 font-medium transition-colors group-hover:text-link",
                        i === 0 ? "font-display text-headline font-bold" : "text-title",
                      )}
                    >
                      {post.title}
                    </h2>
                    <p className="mt-3 text-fg-muted">{post.excerpt}</p>
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <li key={tag} className="border border-border px-2 py-1 label-mono">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </li>
            ))}
          </Reveal>
        )}
      </section>
    </>
  );
}
