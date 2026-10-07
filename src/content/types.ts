/**
 * Row shapes that mirror the planned Supabase tables 1:1 (snake_case, `_en` / `_ar` pairs).
 * Until the backend phase, rows live in this folder as typed placeholder data; the same
 * rows become `supabase/seed.sql`. Only `src/lib/data/*` reads these files.
 */

export type LocalizedText = { en: string; ar: string };

/** Rich text stored as Tiptap/ProseMirror JSON (same shape the backend will keep in jsonb). */
export type RichMark = { type: string; attrs?: Record<string, unknown> };
export type RichNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: RichMark[];
};
export type RichDoc = { type: "doc"; content?: RichNode[] };

export type ServiceRow = {
  id: string;
  slug: "development" | "branding" | "marketing";
  title_en: string;
  title_ar: string;
  tagline_en: string;
  tagline_ar: string;
  description_en: string;
  description_ar: string;
  sub_services: LocalizedText[];
  /** Which block illustration to render. */
  illustration: "code" | "construction" | "chart";
  icon: string;
  /** The in-house team behind this service (Teams section). */
  team_name_en: string;
  team_name_ar: string;
  team_description_en: string;
  team_description_ar: string;
  team_deliverables: LocalizedText[];
  faqs: { q: LocalizedText; a: LocalizedText }[];
  sort_order: number;
  published: boolean;
};

export type SolutionRow = {
  id: string;
  slug: string;
  kind: "solution" | "platform";
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  /** lucide icon name, or `si:<slug>` for a simple-icons brand mark. */
  icon: string;
  features: LocalizedText[];
  sort_order: number;
  published: boolean;
};

export type TechLogoRow = {
  id: string;
  name: string;
  /** simple-icons export name (e.g. "siShopify"); null renders the name only. */
  icon: string | null;
  marquee_row: 1 | 2;
  sort_order: number;
  published: boolean;
};

export type StatRow = {
  id: string;
  key: string;
  value: number;
  suffix: string;
  label_en: string;
  label_ar: string;
  sort_order: number;
  published: boolean;
};

export type TestimonialRow = {
  id: string;
  quote_en: string;
  quote_ar: string;
  author_name: string;
  author_role_en: string;
  author_role_ar: string;
  company: string;
  country: "EG" | "SA" | "AE" | "KW" | "OM";
  avatar_url: string | null;
  sort_order: number;
  published: boolean;
};

export type ProjectCategoryRow = {
  id: string;
  slug: "development" | "branding" | "marketing" | "ai";
  name_en: string;
  name_ar: string;
  sort_order: number;
};

export type ProjectRow = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  summary_en: string;
  summary_ar: string;
  category: ProjectCategoryRow["slug"];
  tags: string[];
  client_name: string;
  year: number;
  cover_image: string | null;
  /** Placeholder cover art until real images are uploaded. */
  cover_style: "grid" | "blocks" | "brackets" | "chart" | "flow";
  live_url: string | null;
  /** Optional long-form case study body. */
  content_en?: RichDoc | null;
  content_ar?: RichDoc | null;
  gallery?: string[];
  seo_title_en?: string;
  seo_title_ar?: string;
  seo_description_en?: string;
  seo_description_ar?: string;
  challenge_en: string;
  challenge_ar: string;
  approach_en: string;
  approach_ar: string;
  results: { value: string; label: LocalizedText }[];
  services: ServiceRow["slug"][];
  featured: boolean;
  status: "draft" | "published";
  sort_order: number;
};

/** Rich content is stored as simple typed blocks (Tiptap JSON in the backend phase). */
export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

/** Authoring format for seed posts; stored as RichDoc. */
export type PostSeed = Omit<
  PostRow,
  | "content_en"
  | "content_ar"
  | "seo_title_en"
  | "seo_title_ar"
  | "seo_description_en"
  | "seo_description_ar"
> & {
  content_en: ContentBlock[];
  content_ar: ContentBlock[];
};

export type PostRow = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string;
  excerpt_ar: string;
  content_en: RichDoc;
  content_ar: RichDoc;
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
  cover_image: string | null;
  cover_style: ProjectRow["cover_style"];
  author_name: string;
  tags: string[];
  reading_minutes: number;
  status: "draft" | "scheduled" | "published";
  published_at: string;
};

export type TeamMemberRow = {
  id: string;
  name_en: string;
  name_ar: string;
  role_en: string;
  role_ar: string;
  team: ServiceRow["slug"];
  photo_url: string | null;
  sort_order: number;
  published: boolean;
};

export type MediaRow = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  url: string;
  alt_en: string;
  alt_ar: string;
  uploaded_by: string | null;
  created_at: string;
};
