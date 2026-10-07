import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProcessSection } from "@/components/sections/home/home-sections";
import { Services } from "@/components/sections/home/services";
import { PageHero } from "@/components/sections/pages/page-hero";
import type { Locale } from "@/i18n/routing";
import { getServices } from "@/lib/data/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.services" });
  return pageMetadata({ locale, path: "/services", title: t("label"), description: t("intro") });
}

export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.services");
  const services = await getServices(locale);

  return (
    <>
      <PageHero label={t("label")} title={t("title")} intro={t("intro")} />
      <Services items={services} heading={false} />
      <ProcessSection index="02" />
    </>
  );
}
