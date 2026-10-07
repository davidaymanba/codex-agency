import "server-only";
import { headers } from "next/headers";

/**
 * Sliding-window rate limiter. TEMPORARY in-memory store (per server instance); the backend
 * phase moves this to a Postgres function so limits hold across instances.
 */
const g = globalThis as unknown as { __codexRate?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__codexRate ??= new Map<string, number[]>());

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 50_000) hits.clear(); // memory guard
  return { ok: true, retryAfter: 0 };
}

/** Reset a key (e.g. after a successful login). */
export const clearRate = (key: string) => hits.delete(key);

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export function ipFromRequest(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown"
  ).trim();
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
