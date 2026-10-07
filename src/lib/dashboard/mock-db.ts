import "server-only";
import { posts as seedPosts } from "@/content/posts";
import { projectCategories, projects as seedProjects } from "@/content/projects";
import { services as seedServices } from "@/content/services";
import { solutions as seedSolutions } from "@/content/solutions";
import { stats as seedStats } from "@/content/stats";
import { teamMembers as seedTeam } from "@/content/team";
import { techLogos as seedLogos } from "@/content/tech-logos";
import { testimonials as seedTestimonials } from "@/content/testimonials";
import type { MediaRow, PostRow, ProjectRow } from "@/content/types";
import { LEAD_BUDGETS, LEAD_SERVICES } from "@/lib/schemas/lead";
import { blocksToDoc } from "@/lib/rich";
import { siteConfig } from "@/config/site";
import type {
  Activity,
  Lead,
  LeadNote,
  LeadStatus,
  PageViewDay,
  Profile,
  SiteSettings,
} from "./types";

/**
 * TEMPORARY in-memory database used until the Supabase phase. Seeded with deterministic
 * PLACEHOLDER data (fictional people). Lives on `globalThis` so every server module in the
 * process shares one instance; resets when the server restarts.
 */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const P = (id: string, email: string, full_name: string, role: Profile["role"]): Profile => ({
  id,
  email,
  full_name,
  role,
  avatar_url: null,
  active: true,
  invited_at: null,
  invite_token: null,
  last_sign_in_at: null,
  language: "en",
  theme: "system",
});

const PROFILES: Profile[] = [
  P("u-admin", "admin@codex.agency", "Youssef Nabil", "admin"),
  P("u-editor", "editor@codex.agency", "Lina Farouk", "editor"),
  P("u-viewer", "viewer@codex.agency", "Karim Adel", "viewer"),
];

const FIRST = [
  "Ahmed",
  "Sara",
  "Omar",
  "Nour",
  "Khalid",
  "Mona",
  "Faisal",
  "Huda",
  "Tariq",
  "Reem",
  "Yousef",
  "Layla",
  "Hamad",
  "Dina",
  "Saeed",
  "Maha",
  "Ali",
  "Hana",
  "Majed",
  "Rana",
];
const LAST = [
  "Hassan",
  "Al-Qahtani",
  "Mostafa",
  "Al-Mansoori",
  "Saleh",
  "Al-Sabah",
  "Ibrahim",
  "Al-Harthy",
  "Fathy",
  "Al-Otaibi",
  "Kamal",
  "Al-Balushi",
];
const COMPANIES = [
  "Nakhla Dates",
  "Skyline Realty",
  "Fitbox",
  "Gulf Supply",
  "Maharat Academy",
  "Souq Box",
  "Dar Al Oud",
  "Bayt Coffee",
  "Rawda Clinics",
  "Masar Logistics",
  null,
  null,
];
const COUNTRIES: Lead["country"][] = ["SA", "SA", "SA", "EG", "EG", "AE", "AE", "KW", "OM"];
const MESSAGES = [
  "We need a new Salla store with custom gifting and delivery slots.",
  "Looking for a WhatsApp AI agent to qualify real-estate leads.",
  "Rebrand for our coffee chain — logo, packaging and signage.",
  "Performance campaigns on Meta and TikTok for our clinic.",
  "Custom ERP for inventory and purchasing across 3 warehouses.",
  "نحتاج منصة تعليمية بالاشتراكات والشهادات.",
  "نرغب في أتمتة الطلبات بين شوبيفاي ونظام المحاسبة.",
  "تصميم هوية جديدة لشركة ناشئة في مجال التقنية.",
];
const PAGES = [
  "/",
  "/services",
  "/solutions",
  "/ai-automation",
  "/work",
  "/blog",
  "/about",
  "/contact",
];
const REFERRERS = [
  "google",
  "direct",
  "instagram",
  "linkedin",
  "tiktok",
  "chatgpt.com",
  "facebook",
];
const BUDGET_VALUE: Record<string, number> = {
  lt5k: 4000,
  "5to15k": 10000,
  "15to40k": 25000,
  gt40k: 60000,
  unsure: 8000,
};

function seed() {
  const r = rng(20261006);
  const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const now = Date.now();
  const day = 86_400_000;

  const statuses: LeadStatus[] = [
    "new",
    "new",
    "new",
    "contacted",
    "contacted",
    "qualified",
    "qualified",
    "proposal",
    "won",
    "lost",
  ];
  const leads: Lead[] = [];
  const notes: LeadNote[] = [];
  for (let i = 0; i < 64; i++) {
    const created = new Date(
      now - Math.floor(Math.pow(r(), 1.4) * 90 * day) - Math.floor(r() * day),
    );
    const first = pick(FIRST);
    const last = pick(LAST);
    const budget = pick(LEAD_BUDGETS);
    const status = i < 4 ? "new" : pick(statuses);
    const id = `lead-${String(i + 1).padStart(3, "0")}`;
    const msg = pick(MESSAGES);
    leads.push({
      id,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
      phone: `+9665${Math.floor(10000000 + r() * 89999999)}`,
      company: pick(COMPANIES),
      service: pick(LEAD_SERVICES),
      budget,
      message: msg,
      locale: /[؀-ۿ]/.test(msg) ? "ar" : "en",
      country: pick(COUNTRIES),
      source_page: pick(PAGES),
      utm:
        r() > 0.5
          ? { utm_source: pick(["google", "instagram", "tiktok", "linkedin"]), utm_medium: "cpc" }
          : null,
      status,
      assigned_to: status === "new" ? null : pick(["u-admin", "u-editor"]),
      estimated_value:
        status === "new"
          ? null
          : Math.round((BUDGET_VALUE[budget] * (0.7 + r() * 0.8)) / 500) * 500,
      position: i,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
    });
    notes.push({
      id: `note-${id}-0`,
      lead_id: id,
      author_id: null,
      kind: "created",
      body: "Lead created from the website contact form.",
      created_at: created.toISOString(),
    });
    if (status !== "new") {
      notes.push({
        id: `note-${id}-1`,
        lead_id: id,
        author_id: "u-editor",
        kind: "note",
        body: "Called the client — interested, sending a short proposal outline.",
        created_at: new Date(created.getTime() + day).toISOString(),
      });
    }
  }

  const pageViews: PageViewDay[] = [];
  for (let d = 89; d >= 0; d--) {
    const date = new Date(now - d * day);
    const weekend = [5, 6].includes(date.getUTCDay()); // Fri/Sat in the region
    const trend = 1 + (89 - d) / 140;
    const views = Math.round((weekend ? 210 : 340) * trend * (0.8 + r() * 0.45));
    const pages = Object.fromEntries(
      PAGES.map((p, i) => [p, Math.round((views / (i + 1.6)) * (0.7 + r() * 0.5))]),
    );
    const mobile = Math.round(views * (0.58 + r() * 0.08));
    const tablet = Math.round(views * 0.06);
    pageViews.push({
      date: date.toISOString().slice(0, 10),
      views,
      contact_views: Math.round(views * (0.07 + r() * 0.03)),
      pages,
      devices: { desktop: views - mobile - tablet, mobile, tablet },
      locales: { ar: Math.round(views * (0.55 + r() * 0.1)), en: 0 },
      referrers: Object.fromEntries(
        REFERRERS.map((ref, i) => [ref, Math.round((views / (i + 1.4)) * (0.45 + r() * 0.3))]),
      ),
      sessions: [],
    });
    pageViews[pageViews.length - 1].locales.en = views - pageViews[pageViews.length - 1].locales.ar;
  }

  const activity: Activity[] = leads
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 12)
    .map((l, i) => ({
      id: `act-${i}`,
      actor_id: i % 3 === 0 ? null : "u-editor",
      action: i % 3 === 0 ? "create" : "status",
      entity: "lead",
      entity_id: l.id,
      summary: i % 3 === 0 ? `New lead: ${l.name}` : `${l.name} moved to ${l.status}`,
      meta: (i % 3 === 0
        ? { name: l.name }
        : { actor: "Lina Farouk", name: l.name, status: l.status }) as Record<string, string>,
      created_at: l.updated_at,
    }));

  // Site content: cloned from the typed seed files so edits never mutate the originals.
  const clone = <T>(v: T): T => structuredClone(v);
  const projects: ProjectRow[] = clone(seedProjects).map((p) => ({
    content_en: null,
    content_ar: null,
    gallery: [],
    seo_title_en: "",
    seo_title_ar: "",
    seo_description_en: "",
    seo_description_ar: "",
    ...p,
  }));
  const posts: PostRow[] = clone(seedPosts).map((p) => ({
    ...p,
    content_en: blocksToDoc(p.content_en),
    content_ar: blocksToDoc(p.content_ar),
    seo_title_en: "",
    seo_title_ar: "",
    seo_description_en: "",
    seo_description_ar: "",
  }));

  const content = {
    services: clone(seedServices),
    solutions: clone(seedSolutions),
    projects,
    projectCategories: clone(projectCategories),
    posts,
    testimonials: clone(seedTestimonials),
    team: clone(seedTeam),
    stats: clone(seedStats),
    techLogos: clone(seedLogos),
    media: [] as MediaRow[],
  };

  const settings: SiteSettings = {
    email: siteConfig.email,
    phone: siteConfig.phone,
    whatsapp: siteConfig.whatsapp,
    address_en: "Riyadh · Cairo · Dubai",
    address_ar: "الرياض · القاهرة · دبي",
    socials: { ...siteConfig.socials },
    seo_title_en: "CODEX — Software, Branding & Marketing Agency",
    seo_title_ar: "CODEX — وكالة برمجيات وهوية تجارية وتسويق",
    seo_description_en:
      "CODEX is a digital agency with in-house development, brand and marketing teams.",
    seo_description_ar: "CODEX وكالة رقمية بفرق داخلية للبرمجة والهوية والتسويق.",
    announcement_enabled: false,
    announcement_en: "New: AI agents for WhatsApp — book a free demo.",
    announcement_ar: "جديد: وكلاء ذكاء اصطناعي لواتساب — احجز عرضًا مجانيًا.",
    announcement_href: "/ai-automation",
    maintenance: false,
    updated_at: new Date().toISOString(),
  };

  return {
    profiles: PROFILES,
    leads,
    notes,
    pageViews,
    activity,
    ...content,
    settings,
    mediaBlobs: new Map<string, Buffer>(),
  };
}

type DB = ReturnType<typeof seed>;
const g = globalThis as unknown as { __codexMockDb?: DB };
// Re-seed if an older in-memory shape (from before content tables existed) is still around in dev.
export const db: DB =
  g.__codexMockDb && "settings" in g.__codexMockDb ? g.__codexMockDb : (g.__codexMockDb = seed());

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
