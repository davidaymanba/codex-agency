"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { authorize } from "@/lib/auth/session";
import { db, uid } from "@/lib/dashboard/mock-db";
import { logActivity } from "@/lib/dashboard/repo";
import type { Profile } from "@/lib/dashboard/types";

/**
 * User management (admin only). Guards: nobody changes their own access, and there is always
 * at least one active admin. Backend phase: invitations go through Supabase Auth
 * (`auth.admin.inviteUserByEmail`) + a Resend email; here the link is returned to share manually.
 */
type R<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: "forbidden" | "invalid" | "self" | "last_admin" | "exists" | "not_found" };
const roleSchema = z.enum(["admin", "editor", "viewer"]);

const activeAdmins = () =>
  db.profiles.filter((p) => p.role === "admin" && p.active && !p.invited_at);

export async function inviteUser(email: string, role: string, locale: string): Promise<R<string>> {
  const me = await authorize("admin");
  if (!me) return { ok: false, error: "forbidden" };
  const e = z.email().max(120).safeParse(email.trim().toLowerCase());
  const r = roleSchema.safeParse(role);
  if (!e.success || !r.success) return { ok: false, error: "invalid" };
  if (db.profiles.some((p) => p.email === e.data)) return { ok: false, error: "exists" };
  const token = randomBytes(24).toString("base64url");
  const profile: Profile = {
    id: uid("u"),
    email: e.data,
    full_name: e.data.split("@")[0],
    role: r.data,
    avatar_url: null,
    active: false,
    invited_at: new Date().toISOString(),
    invite_token: token,
    last_sign_in_at: null,
    language: locale === "ar" ? "ar" : "en",
    theme: "system",
  };
  db.profiles.push(profile);
  await logActivity({
    actor_id: me.id,
    action: "invite",
    entity: "user",
    entity_id: profile.id,
    summary: `${me.full_name} invited ${e.data} as ${r.data}`,
    meta: { actor: me.full_name, name: e.data, role: r.data },
  });
  return { ok: true, data: `/${locale === "ar" ? "ar" : "en"}/accept-invite?token=${token}` };
}

export async function changeRole(id: string, role: string): Promise<R> {
  const me = await authorize("admin");
  if (!me) return { ok: false, error: "forbidden" };
  const r = roleSchema.safeParse(role);
  const user = db.profiles.find((p) => p.id === id);
  if (!r.success || !user) return { ok: false, error: "invalid" };
  if (user.id === me.id) return { ok: false, error: "self" };
  if (user.role === "admin" && r.data !== "admin" && activeAdmins().length <= 1)
    return { ok: false, error: "last_admin" };
  user.role = r.data;
  await logActivity({
    actor_id: me.id,
    action: "role",
    entity: "user",
    entity_id: id,
    summary: `${me.full_name} changed ${user.full_name} to ${r.data}`,
    meta: { actor: me.full_name, name: user.full_name, role: r.data },
  });
  return { ok: true };
}

export async function setUserActive(id: string, active: boolean): Promise<R> {
  const me = await authorize("admin");
  if (!me) return { ok: false, error: "forbidden" };
  const user = db.profiles.find((p) => p.id === id);
  if (!user || typeof active !== "boolean") return { ok: false, error: "invalid" };
  if (user.id === me.id) return { ok: false, error: "self" };
  if (!active && user.role === "admin" && activeAdmins().length <= 1)
    return { ok: false, error: "last_admin" };
  user.active = active;
  await logActivity({
    actor_id: me.id,
    action: "update",
    entity: "user",
    entity_id: id,
    summary: `${me.full_name} ${active ? "reactivated" : "deactivated"} ${user.full_name}`,
    meta: { name: user.full_name },
  });
  return { ok: true };
}

export async function revokeInvite(id: string): Promise<R> {
  const me = await authorize("admin");
  if (!me) return { ok: false, error: "forbidden" };
  const i = db.profiles.findIndex((p) => p.id === id && p.invited_at);
  if (i === -1) return { ok: false, error: "not_found" };
  const [gone] = db.profiles.splice(i, 1);
  await logActivity({
    actor_id: me.id,
    action: "delete",
    entity: "user",
    entity_id: id,
    summary: `${me.full_name} revoked the invitation for ${gone.email}`,
    meta: { count: "1" },
  });
  return { ok: true };
}
