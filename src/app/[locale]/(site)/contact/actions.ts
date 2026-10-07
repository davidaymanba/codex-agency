"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { createLead } from "@/lib/dashboard/repo";
import { notifyNewLead } from "@/lib/email/notify";
import { clientIp, rateLimit, requestOrigin } from "@/lib/rate-limit";
import { leadMetaSchema, leadSchema } from "@/lib/schemas/lead";
import { verifyTurnstile } from "@/lib/turnstile";

export type LeadResult = { ok: true } | { ok: false; error: "invalid" | "server" | "rate_limited" | "captcha" };

/**
 * Contact form → lead. Order: validate (same zod schema as the form) → honeypot → rate limit
 * (Postgres) → optional Turnstile → insert with the service role (no anon insert policy) →
 * email the team after the response is sent → Realtime toast in the dashboard (DB publication).
 */
export async function submitLead(input: unknown, meta: unknown): Promise<LeadResult> {
  const data = leadSchema.safeParse(input);
  const info = leadMetaSchema.safeParse(meta);
  if (!data.success || !info.success) return { ok: false, error: "invalid" };

  // Honeypot filled → pretend success so bots learn nothing.
  if (data.data.website) return { ok: true };

  const ip = await clientIp();
  if (!(await rateLimit(`lead:${ip}`, 5, 10 * 60_000)).ok) return { ok: false, error: "rate_limited" };
  if (!(await verifyTurnstile(info.data.turnstileToken, ip))) return { ok: false, error: "captcha" };

  try {
    const country = (await headers()).get("x-vercel-ip-country")?.slice(0, 2).toUpperCase() ?? null;
    const lead = await createLead(data.data, { ...info.data, country });
    const origin = await requestOrigin();
    after(() => notifyNewLead(lead, origin));
    return { ok: true };
  } catch (e) {
    console.error("[submitLead]", e);
    return { ok: false, error: "server" };
  }
}
