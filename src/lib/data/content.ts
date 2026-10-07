import "server-only";
import { draftMode } from "next/headers";
import { cache } from "react";
import * as simpleIcons from "simple-icons";
import type {
  PostRow,
  ProjectCategoryRow,
  ProjectRow,
  RichDoc,
  ServiceRow,
  SolutionRow,
  StatRow,
  TeamMemberRow,
  TechLogoRow,
  TestimonialRow,
} from "@/content/types";
import type { Locale } from "@/i18n/routing";
import type { SiteSettings } from "@/lib/dashboard/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabasePublic } from "@/lib/supabase/public";
import { pick, pickText } from "./localize";

/**
 * Public content queries (Supabase, anon client → RLS returns published content only).
 * Each table is loaded once per request (React `cache`) and mapped to localized view models.
 * Public pages are static and re-rendered on demand when the dashboard saves (revalidatePublic).
 */

async function rows<T>(table: string, order = "sort_order"): Promise<T[]> {
  const { data, error } = await supabasePublic().from(table as never).select("*").order(order as never);
  if (error) throw new Error(`[content] ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

const db = {
  services: cache(() => rows<ServiceRow>("services")),
  solutions: cache(() => rows<SolutionRow>("solutions")),
  stats: cache(() => rows<StatRow>("stats")),
  testimonials: cache(() => rows<TestimonialRow>("testimonials")),
  techLogos: cache(() => rows<TechLogoRow>("tech_logos")),
  team: cache(() => rows<TeamMemberRow>("team_members")),
  projectCategories: cache(() => rows<ProjectCategoryRow>("project_categories")),
  projects: cache(() => rows<ProjectRow>("projects")),
  posts: cache(() => rows<PostRow>("posts", "published_at")),
  settings: cache(async () => {
    const { data } = await supabasePublic().from("site_settings").select("*").eq("id", 1).maybeSingle();
    return data as unknown as SiteSettings | null;
  }),
};

const byOrder = <T extends { sort_order: number; published: boolean }>(list: T[]) =>
  list.filter((r) => r.published).sort((a, b) => a.sort_order - b.sort_order);

/** Resolve a simple-icons export name (e.g. "siShopify") to its SVG path, server-side only. */
function brandPath(name: string | null): string | null {
  if (!name) return null;
  const icon = (simpleIcons as unknown as Record<string, { path: string } | undefined>)[name];
  return icon?.path ?? null;
}

export type ServiceVM = {
  slug: ServiceRow["slug"];
  index: string;
  title: string;
  tagline: string;
  description: string;
  subServices: string[];
  illustration: ServiceRow["illustration"];
  faqs: { q: string; a: string }[];
};

export async function getServices(locale: Locale): Promise<ServiceVM[]> {
  return byOrder(await db.services()).map((s, i) => ({
    slug: s.slug,
    index: String(i + 1).padStart(2, "0"),
    title: pick(s, "title", locale),
    tagline: pick(s, "tagline", locale),
    description: pick(s, "description", locale),
    subServices: s.sub_services.map((t) => pickText(t, locale)),
    illustration: s.illustration,
    faqs: s.faqs.map((f) => ({ q: pickText(f.q, locale), a: pickText(f.a, locale) })),
  }));
}

export async function getService(locale: Locale, slug: string): Promise<ServiceVM | null> {
  return (await getServices(locale)).find((s) => s.slug === slug) ?? null;
}

export const getServiceSlugs = async () => byOrder(await db.services()).map((s) => s.slug);

export type SolutionVM = {
  slug: string;
  kind: "solution" | "platform";
  title: string;
  description: string;
  /** lucide icon name when not a brand mark */
  icon: string | null;
  /** simple-icons path when the icon is a brand mark */
  brandPath: string | null;
  features: string[];
};

export async function getSolutions(locale: Locale): Promise<SolutionVM[]> {
  return byOrder(await db.solutions()).map((s) => {
    const isBrand = s.icon.startsWith("si:");
    return {
      slug: s.slug,
      kind: s.kind,
      title: pick(s, "title", locale),
      description: pick(s, "description", locale),
      icon: isBrand ? null : s.icon,
      brandPath: isBrand ? brandPath(s.icon.slice(3)) : null,
      features: s.features.map((f) => pickText(f, locale)),
    };
  });
}

export type TechLogoVM = { name: string; path: string | null };

export async function getTechLogos(): Promise<{ row1: TechLogoVM[]; row2: TechLogoVM[] }> {
  const rows = byOrder(await db.techLogos()).map((t) => ({
    name: t.name,
    path: brandPath(t.icon),
    row: t.marquee_row,
  }));
  return {
    row1: rows.filter((r) => r.row === 1).map(({ name, path }) => ({ name, path })),
    row2: rows.filter((r) => r.row === 2).map(({ name, path }) => ({ name, path })),
  };
}

/* ---------------------------------------------------------------- Teams */

export type TeamVM = {
  slug: ServiceRow["slug"];
  name: string;
  description: string;
  deliverables: string[];
};

export async function getTeams(locale: Locale): Promise<TeamVM[]> {
  return byOrder(await db.services()).map((s) => ({
    slug: s.slug,
    name: pick(s, "team_name", locale),
    description: pick(s, "team_description", locale),
    deliverables: s.team_deliverables.map((t) => pickText(t, locale)),
  }));
}

/* ---------------------------------------------------------------- Stats */

export type StatVM = { key: string; value: number; suffix: string; label: string };

export async function getStats(locale: Locale): Promise<StatVM[]> {
  return byOrder(await db.stats()).map((s) => ({
    key: s.key,
    value: s.value,
    suffix: s.suffix,
    label: pick(s, "label", locale),
  }));
}

/* ---------------------------------------------------------------- Testimonials */

export type TestimonialVM = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  country: string;
};

export async function getTestimonials(locale: Locale): Promise<TestimonialVM[]> {
  return byOrder(await db.testimonials()).map((t) => ({
    id: t.id,
    quote: pick(t, "quote", locale),
    name: t.author_name,
    role: pick(t, "author_role", locale),
    company: t.company,
    country: t.country,
  }));
}

/* ---------------------------------------------------------------- Projects */

export type ProjectCategoryVM = { slug: ProjectRow["category"]; name: string };

export type ProjectVM = {
  slug: string;
  title: string;
  summary: string;
  category: ProjectRow["category"];
  categoryName: string;
  tags: string[];
  client: string;
  year: number;
  cover: string | null;
  coverStyle: ProjectRow["cover_style"];
};

export async function getProjectCategories(locale: Locale): Promise<ProjectCategoryVM[]> {
  return [...(await db.projectCategories())]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ slug: c.slug, name: pick(c, "name", locale) }));
}

export type ProjectDetailVM = ProjectVM & {
  challenge: string;
  approach: string;
  results: { value: string; label: string }[];
  services: { slug: ServiceRow["slug"]; title: string }[];
  liveUrl: string | null;
  next: { slug: string; title: string } | null;
  content: RichDoc | null;
  gallery: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  draft: boolean;
};

const published = async () =>
  (await db.projects()).filter((p) => p.status === "published").sort((a, b) => a.sort_order - b.sort_order);

async function toProjectVM(p: ProjectRow, locale: Locale): Promise<ProjectVM> {
  const cats = await getProjectCategories(locale);
  return {
    slug: p.slug,
    title: pick(p, "title", locale),
    summary: pick(p, "summary", locale),
    category: p.category,
    categoryName: cats.find((c) => c.slug === p.category)?.name ?? p.category,
    tags: p.tags,
    client: p.client_name,
    year: p.year,
    cover: p.cover_image,
    coverStyle: p.cover_style,
  };
}

export async function getProjects(locale: Locale): Promise<ProjectVM[]> {
  return Promise.all((await published()).map((p) => toProjectVM(p, locale)));
}

export async function getFeaturedProjects(locale: Locale, limit = 6): Promise<ProjectVM[]> {
  return Promise.all(
    (await published())
      .filter((p) => p.featured)
      .slice(0, limit)
      .map((p) => toProjectVM(p, locale)),
  );
}

/** True while an editor previews drafts (Next.js draft mode, enabled by /api/dashboard/preview). */
const previewing = async () => {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false; // outside a request (e.g. generateStaticParams)
  }
};

export async function getProject(locale: Locale, slug: string): Promise<ProjectDetailVM | null> {
  const list = await published();
  let i = list.findIndex((p) => p.slug === slug);
  let p = list[i];
  if (!p && (await previewing())) {
    // Draft preview (signed-in staff only): read the unpublished row with the service role.
    const { data } = await supabaseAdmin().from("projects").select("*").eq("slug", slug).maybeSingle();
    p = data as unknown as ProjectRow;
    i = 0;
  }
  if (!p) return null;
  const nextRow = list[(i + 1) % list.length];
  const svcRows = await db.services();
  return {
    content: (locale === "ar" ? p.content_ar : p.content_en) ?? null,
    gallery: p.gallery ?? [],
    seoTitle: pick(p, "seo_title", locale) || null,
    seoDescription: pick(p, "seo_description", locale) || null,
    draft: p.status !== "published",
    ...(await toProjectVM(p, locale)),
    challenge: pick(p, "challenge", locale),
    approach: pick(p, "approach", locale),
    results: p.results.map((r) => ({ value: r.value, label: pickText(r.label, locale) })),
    services: p.services.map((slug) => {
      const svc = svcRows.find((s) => s.slug === slug)!;
      return { slug, title: pick(svc, "title", locale) };
    }),
    liveUrl: p.live_url,
    next:
      nextRow && nextRow.slug !== p.slug
        ? { slug: nextRow.slug, title: pick(nextRow, "title", locale) }
        : null,
  };
}

export const getProjectSlugs = async () => (await published()).map((p) => p.slug);

/* ---------------------------------------------------------------- Posts */

export type PostVM = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  minutes: number;
  author: string;
  cover: string | null;
  coverStyle: PostRow["cover_style"];
};

export type PostDetailVM = PostVM & {
  content: RichDoc;
  seoTitle: string | null;
  seoDescription: string | null;
  draft: boolean;
};

/** Published, or scheduled with a publish date that has passed. */
const livePosts = async () =>
  (await db.posts())
    .filter((p) => (p.status === "published" || p.status === "scheduled") && new Date(p.published_at) <= new Date())
    .sort((a, b) => b.published_at.localeCompare(a.published_at));

function toPostVM(p: PostRow, locale: Locale): PostVM {
  return {
    slug: p.slug,
    title: pick(p, "title", locale),
    excerpt: pick(p, "excerpt", locale),
    date: p.published_at,
    tags: p.tags,
    minutes: p.reading_minutes,
    author: p.author_name,
    cover: p.cover_image,
    coverStyle: p.cover_style,
  };
}

export async function getPosts(locale: Locale): Promise<PostVM[]> {
  return (await livePosts()).map((p) => toPostVM(p, locale));
}

export async function getPost(locale: Locale, slug: string): Promise<PostDetailVM | null> {
  const live = await livePosts();
  let p = live.find((x) => x.slug === slug);
  if (!p && (await previewing())) {
    const { data } = await supabaseAdmin().from("posts").select("*").eq("slug", slug).maybeSingle();
    p = (data as unknown as PostRow) ?? undefined;
  }
  if (!p) return null;
  return {
    ...toPostVM(p, locale),
    content: locale === "ar" ? p.content_ar : p.content_en,
    seoTitle: pick(p, "seo_title", locale) || null,
    seoDescription: pick(p, "seo_description", locale) || null,
    draft: !live.includes(p),
  };
}

export const getPostSlugs = async () => (await livePosts()).map((p) => p.slug);

/* ---------------------------------------------------------------- Team members */

export type TeamMemberVM = {
  id: string;
  name: string;
  role: string;
  team: ServiceRow["slug"];
  photo: string | null;
};

export async function getTeamMembers(locale: Locale): Promise<TeamMemberVM[]> {
  return byOrder(await db.team()).map((m) => ({
    id: m.id,
    name: pick(m, "name", locale),
    role: pick(m, "role", locale),
    team: m.team,
    photo: m.photo_url,
  }));
}

/* ---------------------------------------------------------------- Site settings */

export type PublicSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  socials: Record<"instagram" | "linkedin" | "behance" | "x" | "tiktok", string>;
  seoTitle: string;
  seoDescription: string;
  announcement: { text: string; href: string } | null;
  maintenance: boolean;
};

export async function getSettings(locale: Locale): Promise<PublicSettings> {
  const s = (await db.settings()) ?? FALLBACK_SETTINGS;
  return {
    email: s.email,
    phone: s.phone,
    whatsapp: s.whatsapp,
    address: pick(s, "address", locale),
    socials: s.socials,
    seoTitle: pick(s, "seo_title", locale),
    seoDescription: pick(s, "seo_description", locale),
    announcement:
      s.announcement_enabled && pick(s, "announcement", locale)
        ? { text: pick(s, "announcement", locale), href: s.announcement_href }
        : null,
    maintenance: s.maintenance,
  };
}

const FALLBACK_SETTINGS: SiteSettings = {
  email: "",
  phone: "",
  whatsapp: "",
  address_en: "",
  address_ar: "",
  socials: { instagram: "", linkedin: "", behance: "", x: "", tiktok: "" },
  seo_title_en: "",
  seo_title_ar: "",
  seo_description_en: "",
  seo_description_ar: "",
  announcement_enabled: false,
  announcement_en: "",
  announcement_ar: "",
  announcement_href: "",
  maintenance: false,
  updated_at: "",
};
