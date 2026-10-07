import { z } from "zod";
import { loc } from "./content";

const optUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\//.test(v), "url");

/** Site settings form (errors are keys under `dash.form.errors`). */
export const settingsSchema = z.object({
  email: z.email("invalid").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "invalid"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9]{8,15}$/, "invalid"),
  address: loc(1, 120),
  socials: z.object({
    instagram: optUrl,
    linkedin: optUrl,
    behance: optUrl,
    x: optUrl,
    tiktok: optUrl,
  }),
  seo_title: loc(10, 70),
  seo_description: loc(20, 160),
  announcement_enabled: z.boolean(),
  announcement: z.object({
    en: z.string().trim().max(140, "long"),
    ar: z.string().trim().max(140, "long"),
  }),
  announcement_href: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^(\/|https:\/\/)/.test(v), "url"),
  maintenance: z.boolean(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
