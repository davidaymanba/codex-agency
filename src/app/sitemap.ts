import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { getPostSlugs, getProjectSlugs, getServiceSlugs } from "@/lib/data/content";

/** Every public page in every locale, with hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts] = await Promise.all([
    getServiceSlugs(),
    getProjectSlugs(),
    getPostSlugs(),
  ]);
  const paths = [
    "",
    "/services",
    ...services.map((s) => `/services/${s}`),
    "/solutions",
    "/ai-automation",
    "/work",
    ...projects.map((s) => `/work/${s}`),
    "/blog",
    ...posts.map((s) => `/blog/${s}`),
    "/about",
    "/contact",
  ];
  const url = (locale: string, path: string) => `${siteConfig.url}/${locale}${path}`;

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      lastModified: new Date(),
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : path.split("/").length > 2 ? 0.6 : 0.8,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, url(l, path)])) },
    })),
  );
}
