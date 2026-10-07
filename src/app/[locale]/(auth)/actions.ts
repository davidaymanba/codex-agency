"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encodeSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session";
import { clearRate, clientIp, rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/dashboard/mock-db";
import { logActivity } from "@/lib/dashboard/repo";
import { emailOnlySchema, inviteSchema, loginSchema, resetSchema } from "@/lib/schemas/auth";

export type AuthResult =
  | { ok: true }
  | {
      ok: false;
      error: "invalid" | "credentials" | "unavailable" | "locked";
      retryMinutes?: number;
    };

/**
 * TEMPORARY auth actions. In development, the seeded accounts sign in with the password in
 * DEV_LOGIN_PASSWORD (default "codex-dev"). In production these are disabled until
 * Supabase Auth is wired in the backend phase.
 */
const DEV = process.env.NODE_ENV !== "production";
const DEV_PASSWORD = process.env.DEV_LOGIN_PASSWORD ?? "codex-dev";

const safeNext = (locale: string, next: unknown) =>
  typeof next === "string" && next.startsWith(`/${locale}/dashboard`) && !next.startsWith("//")
    ? next
    : `/${locale}/dashboard`;

export async function signIn(locale: string, input: unknown, next?: string): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!DEV) return { ok: false, error: "unavailable" };
  // Brute-force protection: per IP and per account.
  const ip = await clientIp();
  const email = parsed.data.email.toLowerCase();
  const byIp = rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
  const byEmail = rateLimit(`login:email:${email}`, 5, 15 * 60_000);
  if (!byIp.ok || !byEmail.ok)
    return {
      ok: false,
      error: "locked",
      retryMinutes: Math.ceil(Math.max(byIp.retryAfter, byEmail.retryAfter) / 60),
    };
  const user = db.profiles.find((p) => p.email === email && p.active);
  if (!user || parsed.data.password !== DEV_PASSWORD) return { ok: false, error: "credentials" };

  (await cookies()).set(SESSION_COOKIE, encodeSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: !DEV,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  clearRate(`login:email:${email}`);
  user.last_sign_in_at = new Date().toISOString();
  await logActivity({
    actor_id: user.id,
    action: "login",
    entity: "user",
    entity_id: user.id,
    summary: `${user.full_name} signed in`,
    meta: { name: user.full_name },
  });
  redirect(safeNext(locale, next));
}

export async function signOut(locale: string) {
  (await cookies()).delete(SESSION_COOKIE);
  redirect(`/${locale}/login`);
}

/** Magic link / forgot password: always "sent" (never reveal whether an email exists). */
export async function requestEmail(input: unknown): Promise<AuthResult> {
  if (!rateLimit(`email:${await clientIp()}`, 5, 15 * 60_000).ok)
    return { ok: false, error: "locked", retryMinutes: 15 };
  return emailOnlySchema.safeParse(input).success ? { ok: true } : { ok: false, error: "invalid" };
}

export async function resetPassword(input: unknown): Promise<AuthResult> {
  if (!resetSchema.safeParse(input).success) return { ok: false, error: "invalid" };
  return DEV ? { ok: true } : { ok: false, error: "unavailable" };
}

export async function acceptInvite(token: string, input: unknown): Promise<AuthResult> {
  if (!rateLimit(`invite:${await clientIp()}`, 10, 15 * 60_000).ok)
    return { ok: false, error: "locked", retryMinutes: 15 };
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success || typeof token !== "string" || token.length < 20)
    return { ok: false, error: "invalid" };
  if (!DEV) return { ok: false, error: "unavailable" };
  const user = db.profiles.find((p) => p.invite_token === token && p.invited_at);
  if (!user) return { ok: false, error: "invalid" };
  user.full_name = parsed.data.fullName;
  user.active = true;
  user.invited_at = null;
  user.invite_token = null;
  return { ok: true };
}
