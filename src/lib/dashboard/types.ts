import type { LEAD_BUDGETS, LEAD_SERVICES } from "@/lib/schemas/lead";

/** Row shapes mirroring the planned Supabase tables (snake_case kept for a 1:1 swap). */

export type Role = "admin" | "editor" | "viewer";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string | null;
  active: boolean;
  /** Set while an invitation is pending (cleared on first sign-in). */
  invited_at: string | null;
  last_sign_in_at: string | null;
  language: "en" | "ar";
  theme: "system" | "light" | "dark";
};

export type SiteSettings = {
  email: string;
  phone: string;
  whatsapp: string;
  address_en: string;
  address_ar: string;
  socials: { instagram: string; linkedin: string; behance: string; x: string; tiktok: string };
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
  announcement_enabled: boolean;
  announcement_en: string;
  announcement_ar: string;
  announcement_href: string;
  maintenance: boolean;
  updated_at: string;
};

export const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadService = (typeof LEAD_SERVICES)[number];
export type LeadBudget = (typeof LEAD_BUDGETS)[number];

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  service: LeadService;
  budget: LeadBudget;
  message: string;
  locale: "en" | "ar";
  country: string | null;
  source_page: string | null;
  utm: Record<string, string> | null;
  status: LeadStatus;
  assigned_to: string | null;
  estimated_value: number | null;
  /** Position inside its kanban column. */
  position: number;
  created_at: string;
  updated_at: string;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string | null;
  kind: "note" | "status" | "assign" | "created";
  body: string;
  created_at: string;
};

export type Activity = {
  id: string;
  actor_id: string | null;
  action:
    | "create"
    | "update"
    | "delete"
    | "status"
    | "assign"
    | "note"
    | "login"
    | "content_create"
    | "content_update"
    | "content_delete"
    | "publish"
    | "unpublish"
    | "reorder"
    | "upload"
    | "invite"
    | "role"
    | "settings";
  entity: "lead" | "project" | "post" | "settings" | "user" | "content" | "media";
  entity_id: string | null;
  /** English fallback (also what the CSV/audit export shows). */
  summary: string;
  /** Values for the localized message `dash.activity.<action>`. */
  meta: Record<string, string>;
  created_at: string;
};

export type PageViewDay = {
  date: string; // YYYY-MM-DD
  views: number;
  contact_views: number;
  pages: Record<string, number>;
  devices: { desktop: number; mobile: number; tablet: number };
  locales: { en: number; ar: number };
  referrers: Record<string, number>;
  /** Unique daily visitors (hashed, cookie-less). */
  sessions: string[];
};

export type DateRange = "7d" | "30d" | "90d";
export const RANGE_DAYS: Record<DateRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
