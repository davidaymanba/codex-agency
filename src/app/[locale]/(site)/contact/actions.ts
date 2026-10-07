"use server";

import { createLead } from "@/lib/dashboard/repo";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { leadMetaSchema, leadSchema } from "@/lib/schemas/lead";
import { verifyTurnstile } from "@/lib/turnstile";

export type LeadResult =
  { ok: true } | { ok: false; error: "invalid" | "server" | "rate_limited" | "captcha" };

/**
 * Receives a contact-form submission. Re-validates on the server with the same schema.
 *
 * Today the lead goes into the TEMPORARY in-memory store, so it shows up in the dashboard.
 * BACKEND PHASE (Supabase) replaces that with, in this order:
 *   1. rate limit by IP (Postgres function)        2. optional Cloudflare Turnstile check
 *   3. insert into `leads` with the service-role client (no anon insert policy)
 *   4. Resend notification to the team             5. Realtime toast in the dashboard
 */
export async function submitLead(input: unknown, meta: unknown): Promise<LeadResult> {
  const data = leadSchema.safeParse(input);
  const info = leadMetaSchema.safeParse(meta);
  if (!data.success || !info.success) return { ok: false, error: "invalid" };

  // Honeypot filled → pretend success so bots learn nothing.
  if (data.data.website) return { ok: true };

  const ip = await clientIp();
  if (!rateLimit(`lead:${ip}`, 5, 10 * 60_000).ok) return { ok: false, error: "rate_limited" };
  if (!(await verifyTurnstile(info.data.turnstileToken, ip)))
    return { ok: false, error: "captcha" };

  try {
    await createLead(data.data, info.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
