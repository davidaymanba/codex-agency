import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeaturedWork } from "@/components/sections/home/featured-work";
import { PageHero } from "@/components/sections/pages/page-hero";
import type { Locale } from "@/i18n/routing";
import { getProjectCategories, getProjects } from "@/lib/data/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/work">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.work" });
  return pageMetadata({ locale, path: "/work", title: t("label"), description: t("intro") });
}

export default async function WorkPage({ params }: PageProps<"/[locale]/work">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.work");
  const [projects, categories] = await Promise.all([
    getProjects(locale),
    getProjectCategories(locale),
  ]);

  return (
    <>
      <PageHero label={t("label")} title={t("title")} intro={t("intro")} />
      <section aria-label={t("label")} className="container-x pb-24 md:pb-36">
        <FeaturedWork projects={projects} categories={categories} />
      </section>
    </>
  );
}
