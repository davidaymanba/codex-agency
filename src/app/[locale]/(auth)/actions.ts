"use server";

import { redirect } from "next/navigation";
import { clearRate, clientIp, rateLimit, requestOrigin } from "@/lib/rate-limit";
import { emailOnlySchema, inviteSchema, loginSchema, resetSchema } from "@/lib/schemas/auth";
import { supabaseServer } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "credentials" | "unavailable" | "locked"; retryMinutes?: number };

/** Supabase Auth actions. Sign-up is disabled (invite-only); every path is rate limited. */

const safeNext = (locale: string, next: unknown) =>
  typeof next === "string" && next.startsWith(`/${locale}/dashboard`) && !next.startsWith("//") ? next : `/${locale}/dashboard`;
const L = (locale: string) => (locale === "ar" ? "ar" : "en");

export async function signIn(locale: string, input: unknown, next?: string): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ip = await clientIp();
  const email = parsed.data.email.toLowerCase();
  // Brute-force protection: per IP and per account.
  const [byIp, byEmail] = await Promise.all([rateLimit(`login:ip:${ip}`, 20, 15 * 60_000), rateLimit(`login:email:${email}`, 5, 15 * 60_000)]);
  if (!byIp.ok || !byEmail.ok) return { ok: false, error: "locked", retryMinutes: 15 };

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error || !data.user) return { ok: false, error: "credentials" };
  const { data: profile } = await sb.from("profiles").select("active").eq("id", data.user.id).maybeSingle();
  if (!profile?.active) {
    await sb.auth.signOut();
    return { ok: false, error: "credentials" };
  }
  await clearRate(`login:email:${email}`);
  redirect(safeNext(L(locale), next));
}

export async function signOut(locale: string) {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect(`/${L(locale)}/login`);
}

/** Magic link or password-reset email. Always "sent" (never reveal whether an email exists). */
export async function requestEmail(input: unknown, mode: "magic" | "reset" = "magic", locale = "en"): Promise<AuthResult> {
  const parsed = emailOnlySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await rateLimit(`email:${await clientIp()}`, 5, 15 * 60_000)).ok) return { ok: false, error: "locked", retryMinutes: 15 };
  const sb = await supabaseServer();
  const origin = await requestOrigin();
  const confirm = (next: string) => `${origin}/api/auth/confirm?next=${encodeURIComponent(next)}`;
  if (mode === "magic") {
    await sb.auth.signInWithOtp({ email: parsed.data.email, options: { shouldCreateUser: false, emailRedirectTo: confirm(`/${L(locale)}/dashboard`) } });
  } else {
    await sb.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: confirm(`/${L(locale)}/reset-password`) });
  }
  return { ok: true };
}

/** Set a new password (the recovery link already created a session). */
export async function resetPassword(input: unknown): Promise<AuthResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const sb = await supabaseServer();
  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  return error ? { ok: false, error: "invalid" } : { ok: true };
}

/** Finish an invitation: the invite link signed the user in; now set name + password. */
export async function acceptInvite(input: unknown): Promise<AuthResult> {
  if (!(await rateLimit(`invite:${await clientIp()}`, 10, 15 * 60_000)).ok) return { ok: false, error: "locked", retryMinutes: 15 };
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "invalid" };
  const { error } = await sb.auth.updateUser({ password: parsed.data.password, data: { full_name: parsed.data.fullName } });
  return error ? { ok: false, error: "invalid" } : { ok: true };
}
