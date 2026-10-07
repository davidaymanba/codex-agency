import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/dashboard/mock-db";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";

/**
 * First-party, cookie-less page-view tracking. Aggregates per day (views, pages, devices,
 * locales, referrers) plus a salted daily hash for unique visitors — no raw IPs stored.
 * Honours Do-Not-Track / Global Privacy Control and skips bots.
 * Backend phase: insert into `page_views` (anon-insert blocked; this route uses the service role).
 */
const body = z.object({
  path: z
    .string()
    .max(200)
    .regex(/^\/(en|ar)(\/[\w\-/]*)?$/),
  referrer: z.string().max(500).optional(),
});

const SALT = process.env.SESSION_SECRET ?? "codex-dev-only-secret-change-me";
const KNOWN = [
  "google",
  "bing",
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "x.com",
  "t.co",
  "youtube",
  "chatgpt.com",
  "whatsapp",
];

function referrerBucket(ref: string | undefined, host: string | null) {
  if (!ref) return "direct";
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    if (host && h === host.split(":")[0]) return "internal";
    return KNOWN.find((k) => h.includes(k.replace(".com", ""))) ?? h;
  } catch {
    return "direct";
  }
}

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (
    req.headers.get("dnt") === "1" ||
    req.headers.get("sec-gpc") === "1" ||
    /bot|crawl|spider|slurp|preview/i.test(ua)
  ) {
    return new Response(null, { status: 204 });
  }
  // Cap per IP so nobody can inflate the numbers.
  if (!rateLimit(`track:${ipFromRequest(req)}`, 120, 60_000).ok)
    return new Response(null, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const { path, referrer } = parsed.data;
  if (path.includes("/dashboard")) return new Response(null, { status: 204 });

  const date = new Date().toISOString().slice(0, 10);
  let day = db.pageViews.find((d) => d.date === date);
  if (!day) {
    day = {
      date,
      views: 0,
      contact_views: 0,
      pages: {},
      devices: { desktop: 0, mobile: 0, tablet: 0 },
      locales: { en: 0, ar: 0 },
      referrers: {},
      sessions: [],
    };
    db.pageViews.push(day);
  }
  const locale = path.startsWith("/ar") ? "ar" : "en";
  const page = path.replace(/^\/(en|ar)/, "") || "/";
  const device = /ipad|tablet/i.test(ua)
    ? "tablet"
    : /mobi|android|iphone/i.test(ua)
      ? "mobile"
      : "desktop";
  const ref = referrerBucket(referrer, req.headers.get("host"));
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const visitor = createHash("sha256")
    .update(`${SALT}|${date}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 16);

  day.views += 1;
  day.pages[page] = (day.pages[page] ?? 0) + 1;
  day.devices[device] += 1;
  day.locales[locale] += 1;
  if (ref !== "internal") day.referrers[ref] = (day.referrers[ref] ?? 0) + 1;
  if (page === "/contact") day.contact_views += 1;
  if (!day.sessions.includes(visitor)) day.sessions.push(visitor);
  return new Response(null, { status: 204 });
}
