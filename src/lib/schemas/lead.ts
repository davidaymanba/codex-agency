import { z } from "zod";

/**
 * Contact-form / lead schema — shared by the client form and the server action.
 * Error messages are translation KEYS under `pages.contact.errors`.
 */
export const LEAD_SERVICES = [
  "development",
  "branding",
  "marketing",
  "ai",
  "ecommerce",
  "other",
] as const;
export const LEAD_BUDGETS = ["lt5k", "5to15k", "15to40k", "gt40k", "unsure"] as const;

export const leadSchema = z.object({
  name: z.string().trim().min(2, "required").max(120, "long"),
  email: z.email("email").max(200, "long"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "phone"),
  company: z.string().trim().max(160, "long").optional(),
  service: z.enum(LEAD_SERVICES, { message: "required" }),
  budget: z.enum(LEAD_BUDGETS, { message: "required" }),
  message: z.string().trim().min(20, "short").max(4000, "long"),
  /** Honeypot — real users never see or fill it. */
  website: z.string().max(0).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const leadMetaSchema = z.object({
  locale: z.enum(["en", "ar"]),
  sourcePage: z.string().max(300).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional(),
  turnstileToken: z.string().max(2048).optional(),
});

export type LeadMeta = z.infer<typeof leadMetaSchema>;
