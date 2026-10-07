import "server-only";
import type { PostRow, ProjectRow } from "@/content/types";
import type { z } from "zod";
import {
  serviceSchema,
  solutionSchema,
  statSchema,
  teamMemberSchema,
  techLogoSchema,
  testimonialSchema,
} from "@/lib/schemas/content";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Registry of the "simple" content collections managed by one generic dashboard screen.
 * `loc` = form fields stored as `<field>_en` / `<field>_ar` columns.
 */
type Row = Record<string, unknown> & { id: string; sort_order: number; published: boolean };

type Def = {
  /** Postgres table name. */
  table: string;
  schema: z.ZodType;
  loc: string[];
  unique?: string;
  title: (r: Row) => string;
  subtitle?: (r: Row) => string;
  image?: (r: Row) => string | null;
};

export const COLLECTIONS = {
  testimonials: {
    table: "testimonials",
    schema: testimonialSchema,
    loc: ["quote", "author_role"],
    title: (r) => String(r.author_name),
    subtitle: (r) => `${r.company} · ${r.country}`,
    image: (r) => (r.avatar_url as string | null) ?? null,
  },
  team: {
    table: "team_members",
    schema: teamMemberSchema,
    loc: ["name", "role"],
    title: (r) => String(r.name_en),
    subtitle: (r) => String(r.role_en),
    image: (r) => (r.photo_url as string | null) ?? null,
  },
  stats: {
    table: "stats",
    schema: statSchema,
    loc: ["label"],
    unique: "key",
    title: (r) => `${r.value}${r.suffix}`,
    subtitle: (r) => String(r.label_en),
  },
  techLogos: {
    table: "tech_logos",
    schema: techLogoSchema,
    loc: [],
    title: (r) => String(r.name),
    subtitle: (r) => `row ${r.marquee_row}${r.icon ? ` · ${r.icon}` : ""}`,
  },
  services: {
    table: "services",
    schema: serviceSchema,
    loc: ["title", "tagline", "description", "team_name", "team_description"],
    unique: "slug",
    title: (r) => String(r.title_en),
    subtitle: (r) => String(r.tagline_en),
  },
  solutions: {
    table: "solutions",
    schema: solutionSchema,
    loc: ["title", "description"],
    unique: "slug",
    title: (r) => String(r.title_en),
    subtitle: (r) => `${r.kind} · ${r.slug}`,
  },
} satisfies Record<string, Def>;

export type CollectionKey = keyof typeof COLLECTIONS;
export const COLLECTION_KEYS = Object.keys(COLLECTIONS) as CollectionKey[];

/** Row → form values (pick schema keys, fold `_en/_ar` into `{ en, ar }`). */
export function toForm(key: CollectionKey, row: Row): Record<string, unknown> {
  const def: Def = COLLECTIONS[key];
  const shape = (def.schema as unknown as { shape: Record<string, unknown> }).shape;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(shape)) {
    out[k] = def.loc.includes(k)
      ? { en: row[`${k}_en`] ?? "", ar: row[`${k}_ar`] ?? "" }
      : (row[k] ?? (k.endsWith("_url") || k === "icon" ? "" : row[k]));
  }
  return out;
}

/** Validated form values → row fields. */
export function toRow(
  key: CollectionKey,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const def: Def = COLLECTIONS[key];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (def.loc.includes(k)) {
      const pair = v as { en: string; ar: string };
      out[`${k}_en`] = pair.en;
      out[`${k}_ar`] = pair.ar;
    } else out[k] = v;
  }
  return out;
}

export type CollectionItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  published: boolean;
  values: Record<string, unknown>;
};

/** All rows of a collection for the dashboard (RLS: staff see drafts too). */
export async function collectionRows(key: CollectionKey): Promise<Row[]> {
  const def: Def = COLLECTIONS[key];
  const { data } = await (await supabaseServer()).from(def.table as never).select("*").order("sort_order" as never);
  return (data ?? []) as unknown as Row[];
}

export async function listCollection(key: CollectionKey): Promise<CollectionItem[]> {
  const def: Def = COLLECTIONS[key];
  return (await collectionRows(key)).map((r) => ({
      id: r.id,
      title: def.title(r),
      subtitle: def.subtitle?.(r) ?? "",
      image: def.image?.(r) ?? null,
      published: r.published,
      values: toForm(key, r),
    }));
}

export const getDef = (key: CollectionKey): Def => COLLECTIONS[key];

/* ---------------------------------------------------------------- projects & posts (dedicated editors) */

const pair = (r: Record<string, unknown>, k: string) => ({
  en: String(r[`${k}_en`] ?? ""),
  ar: String(r[`${k}_ar`] ?? ""),
});

export function projectToForm(p: ProjectRow) {
  return {
    slug: p.slug,
    title: pair(p, "title"),
    summary: pair(p, "summary"),
    challenge: pair(p, "challenge"),
    approach: pair(p, "approach"),
    content_en: p.content_en ?? null,
    content_ar: p.content_ar ?? null,
    category: p.category,
    tags: p.tags,
    client_name: p.client_name,
    year: p.year,
    cover_image: p.cover_image ?? "",
    cover_style: p.cover_style,
    gallery: p.gallery ?? [],
    live_url: p.live_url ?? "",
    results: p.results,
    services: p.services,
    featured: p.featured,
    status: p.status,
    seo_title: pair(p, "seo_title"),
    seo_description: pair(p, "seo_description"),
  };
}

export function postToForm(p: PostRow) {
  return {
    slug: p.slug,
    title: pair(p, "title"),
    excerpt: pair(p, "excerpt"),
    content_en: p.content_en,
    content_ar: p.content_ar,
    cover_image: p.cover_image ?? "",
    cover_style: p.cover_style,
    tags: p.tags,
    author_name: p.author_name,
    status: p.status,
    published_at: p.published_at,
    seo_title: pair(p, "seo_title"),
    seo_description: pair(p, "seo_description"),
  };
}
