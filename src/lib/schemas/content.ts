import { z } from "zod";

/**
 * Dashboard content schemas — shared by the forms (inline validation) and the server
 * actions (authoritative validation). Messages are keys under `dash.form.errors`.
 * Form shape: translatable fields are `{ en, ar }` objects; the server maps them to `_en/_ar`.
 */

export const loc = (min = 1, max = 300) =>
  z.object({
    en: z
      .string()
      .trim()
      .min(min, min > 1 ? "short" : "required")
      .max(max, "long"),
    ar: z
      .string()
      .trim()
      .min(min, min > 1 ? "short" : "required")
      .max(max, "long"),
  });
const optLoc = (max = 300) =>
  z.object({ en: z.string().trim().max(max, "long"), ar: z.string().trim().max(max, "long") });
const slug = z
  .string()
  .trim()
  .min(2, "required")
  .max(80, "long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug");
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^(\/|https:\/\/)/.test(v), "url")
  .transform((v) => (v === "" ? null : v))
  .nullable();
const text = (max = 120, min = 1) => z.string().trim().min(min, "required").max(max, "long");

export const SERVICE_SLUGS = ["development", "branding", "marketing"] as const;
export const COUNTRIES = ["EG", "SA", "AE", "KW", "OM"] as const;

export const testimonialSchema = z.object({
  quote: loc(10, 600),
  author_name: text(80),
  author_role: loc(1, 80),
  company: text(120),
  country: z.enum(COUNTRIES),
  avatar_url: imageUrl,
  published: z.boolean(),
});

export const teamMemberSchema = z.object({
  name: loc(1, 80),
  role: loc(1, 80),
  team: z.enum(SERVICE_SLUGS),
  photo_url: imageUrl,
  published: z.boolean(),
});

export const statSchema = z.object({
  key: slug,
  value: z.coerce.number<number>().int("number").min(0, "number").max(10_000_000, "number"),
  suffix: z.string().trim().max(4, "long"),
  label: loc(1, 60),
  published: z.boolean(),
});

export const techLogoSchema = z.object({
  name: text(40),
  icon: z
    .string()
    .trim()
    .max(60)
    .refine((v) => v === "" || /^si[A-Z][A-Za-z0-9]*$/.test(v), "icon")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  marquee_row: z.coerce.number<number>().pipe(z.union([z.literal(1), z.literal(2)])),
  published: z.boolean(),
});

const locList = z.array(loc(1, 160)).max(20, "long");

export const serviceSchema = z.object({
  slug: z.enum(SERVICE_SLUGS),
  title: loc(1, 60),
  tagline: loc(1, 120),
  description: loc(10, 400),
  sub_services: locList,
  illustration: z.enum(["code", "construction", "chart"]),
  team_name: loc(1, 60),
  team_description: loc(10, 300),
  team_deliverables: locList,
  faqs: z.array(z.object({ q: loc(3, 200), a: loc(3, 600) })).max(12, "long"),
  published: z.boolean(),
});

export const solutionSchema = z.object({
  slug,
  kind: z.enum(["solution", "platform"]),
  title: loc(1, 60),
  description: loc(10, 300),
  icon: text(60),
  features: locList,
  published: z.boolean(),
});

/* ---------------------------------------------------------------- rich documents */

const richNode: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    type: z.string().max(40),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(richNode).max(2000).optional(),
    text: z.string().max(20_000).optional(),
    marks: z
      .array(
        z.object({ type: z.string().max(30), attrs: z.record(z.string(), z.unknown()).optional() }),
      )
      .max(10)
      .optional(),
  }),
);
export const richDoc = z.object({
  type: z.literal("doc"),
  content: z.array(richNode).max(2000).optional(),
});

export const projectSchema = z.object({
  slug,
  title: loc(1, 120),
  summary: loc(10, 400),
  challenge: loc(10, 1000),
  approach: loc(10, 1000),
  content_en: richDoc.nullable(),
  content_ar: richDoc.nullable(),
  category: z.enum(["development", "branding", "marketing", "ai"]),
  tags: z.array(z.string().trim().min(1).max(30)).max(12, "long"),
  client_name: text(80),
  year: z.coerce.number<number>().int("number").min(2000, "number").max(2100, "number"),
  cover_image: imageUrl,
  cover_style: z.enum(["grid", "blocks", "brackets", "chart", "flow"]),
  gallery: z.array(z.string().max(500)).max(24, "long"),
  live_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https:\/\//.test(v), "url")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  results: z
    .array(
      z.object({ value: z.string().trim().min(1, "required").max(16, "long"), label: loc(1, 80) }),
    )
    .max(6, "long"),
  services: z.array(z.enum(SERVICE_SLUGS)).max(3),
  featured: z.boolean(),
  status: z.enum(["draft", "published"]),
  seo_title: optLoc(70),
  seo_description: optLoc(160),
});

export const postSchema = z.object({
  slug,
  title: loc(1, 140),
  excerpt: loc(10, 300),
  content_en: richDoc,
  content_ar: richDoc,
  cover_image: imageUrl,
  cover_style: z.enum(["grid", "blocks", "brackets", "chart", "flow"]),
  tags: z.array(z.string().trim().min(1).max(30)).max(10, "long"),
  author_name: text(80),
  status: z.enum(["draft", "scheduled", "published"]),
  published_at: z.iso.datetime({ offset: true, message: "date" }),
  seo_title: optLoc(70),
  seo_description: optLoc(160),
});

export type ProjectInput = z.input<typeof projectSchema>;
export type PostInput = z.input<typeof postSchema>;
