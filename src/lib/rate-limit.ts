import "server-only";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Sliding-window rate limiter backed by Postgres (`rate_limit_hit`), so limits hold across
 * every server instance. Fails OPEN only if the database is unreachable.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfter: number }> {
  const { data, error } = await supabaseAdmin().rpc("rate_limit_hit", {
    p_key: key,
    p_max: limit,
    p_window_seconds: Math.ceil(windowMs / 1000),
  });
  if (error) return { ok: true, retryAfter: 0 };
  return { ok: data === true, retryAfter: data ? 0 : Math.ceil(windowMs / 1000) };
}

export async function clearRate(key: string) {
  await supabaseAdmin().rpc("rate_limit_clear", { p_key: key });
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export function ipFromRequest(req: Request): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Same-origin check for cookie-authenticated POST route handlers (defence in depth vs CSRF). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

/** Absolute origin of the current request (for auth email redirect links). */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}
