import { createHash } from "node:crypto";
import { z } from "zod";
import { ipFromRequest, rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * First-party, cookie-less page-view tracking → `page_views` (service role; anon has no insert
 * policy). Stores a salted daily visitor hash, never the IP. Honours DNT / GPC and skips bots.
 */
const body = z.object({
  path: z.string().max(200).regex(/^\/(en|ar)(\/[\w\-/]*)?$/),
  referrer: z.string().max(500).optional(),
});

const SALT = process.env.TRACKING_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "codex";
const KNOWN = ["google", "bing", "instagram", "facebook", "linkedin", "tiktok", "x.com", "t.co", "youtube", "chatgpt.com", "whatsapp"];

function referrerBucket(ref: string | undefined, host: string | null) {
  if (!ref) return "direct";
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    if (host && h === host.split(":")[0]) return null; // internal navigation
    return KNOWN.find((k) => h.includes(k.replace(".com", ""))) ?? h.slice(0, 60);
  } catch {
    return "direct";
  }
}

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1" || /bot|crawl|spider|slurp|preview|lighthouse/i.test(ua)) {
    return new Response(null, { status: 204 });
  }
  const ip = ipFromRequest(req);
  if (!(await rateLimit(`track:${ip}`, 120, 60_000)).ok) return new Response(null, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const { path, referrer } = parsed.data;
  if (path.includes("/dashboard")) return new Response(null, { status: 204 });

  const date = new Date().toISOString().slice(0, 10);
  await supabaseAdmin()
    .from("page_views")
    .insert({
      path: path.replace(/^\/(en|ar)/, "") || "/",
      locale: path.startsWith("/ar") ? "ar" : "en",
      referrer: referrerBucket(referrer, req.headers.get("host")) ?? "internal",
      device: /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop",
      country: req.headers.get("x-vercel-ip-country")?.slice(0, 2) ?? null,
      session_hash: createHash("sha256").update(`${SALT}|${date}|${ip}|${ua}`).digest("hex").slice(0, 16),
    });
  return new Response(null, { status: 204 });
}
