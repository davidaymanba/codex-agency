import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Per-page metadata with canonical + hreflang alternates for every locale.
 * `path` is locale-less, e.g. "/services/branding" ("" for home).
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  type = "website",
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
}): Metadata {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`]));
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { ...languages, "x-default": `/${routing.defaultLocale}${path}` },
    },
    openGraph: {
      type,
      title,
      description,
      images: [
        { url: `/${locale}/opengraph-image`, width: 1200, height: 630, alt: siteConfig.name },
      ],
      url: `${siteConfig.url}/${locale}${path}`,
      siteName: siteConfig.name,
      locale: locale === "ar" ? "ar_AR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/${locale}/opengraph-image`],
    },
  };
}

/** Serialises JSON-LD safely for a <script type="application/ld+json">. */
export const jsonLd = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, "\\u003c"),
});
