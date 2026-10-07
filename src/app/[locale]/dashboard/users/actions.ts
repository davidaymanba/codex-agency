"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize } from "@/lib/auth/session";
import { sendInviteEmail } from "@/lib/email/notify";
import { requestOrigin } from "@/lib/rate-limit";
import { dbError, supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * User management (admin only). Role/active changes run AS THE ADMIN through RLS, and a DB
 * trigger blocks self-changes and removing the last admin. Auth-level operations (invite links,
 * bans, deleting a pending invite) use the service role.
 */
type Err = "forbidden" | "invalid" | "self" | "last_admin" | "exists" | "not_found";
type R<T = undefined> = { ok: true; data?: T } | { ok: false; error: Err };
const roleSchema = z.enum(["admin", "editor", "viewer"]);
const idSchema = z.uuid();
const refresh = () => revalidatePath("/[locale]/dashboard/users", "page");

export async function inviteUser(email: string, role: string, locale: string): Promise<R<{ link: string | null }>> {
  const me = await authorize("admin");
  if (!me) return { ok: false, error: "forbidden" };
  const e = z.email().max(120).safeParse(email.trim().toLowerCase());
  const r = roleSchema.safeParse(role);
  if (!e.success || !r.success) return { ok: false, error: "invalid" };
  const lang = locale === "ar" ? "ar" : "en";

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: e.data,
    options: { data: { language: lang } },
  });
  if (error || !data.user) return { ok: false, error: error?.message?.toLowerCase().includes("already") ? "exists" : "invalid" };

  // Role lives in app_metadata (not user-editable) and on the profile row.
  await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role: r.data } });
  await admin.from("profiles").update({ role: r.data }).eq("id", data.user.id);

  const link = `${await requestOrigin()}/api/auth/confirm?token_hash=${data.properties.hashed_token}&type=invite&next=/${lang}/accept-invite`;
  const emailed = await sendInviteEmail(e.data, link, lang);
  refresh();
  return { ok: true, data: { link: emailed ? null : link } };
}

export async function changeRole(id: string, role: string): Promise<R> {
  const me = await authorize("admin");
  if (!me) return { ok: false, error: "forbidden" };
  const r = roleSchema.safeParse(role);
  if (!r.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  if (id === me.id) return { ok: false, error: "self" };
  const { error, count } = await (await supabaseServer()).from("profiles").update({ role: r.data }, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: (dbError(error) as Err) ?? "invalid" };
  if (!count) return { ok: false, error: "not_found" };
  await supabaseAdmin().auth.admin.updateUserById(id, { app_metadata: { role: r.data } });
  refresh();
  return { ok: true };
}

export async function setUserActive(id: string, active: boolean): Promise<R> {
  const me = await authorize("admin");
  if (!me) return { ok: false, error: "forbidden" };
  if (!idSchema.safeParse(id).success || typeof active !== "boolean") return { ok: false, error: "invalid" };
  if (id === me.id) return { ok: false, error: "self" };
  const { error, count } = await (await supabaseServer()).from("profiles").update({ active }, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: (dbError(error) as Err) ?? "invalid" };
  if (!count) return { ok: false, error: "not_found" };
  // Also block/unblock at the auth level so existing sessions can't refresh.
  await supabaseAdmin().auth.admin.updateUserById(id, { ban_duration: active ? "none" : "876000h" });
  refresh();
  return { ok: true };
}

export async function revokeInvite(id: string): Promise<R> {
  const me = await authorize("admin");
  if (!me) return { ok: false, error: "forbidden" };
  if (!idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const { data: p } = await (await supabaseServer()).from("profiles").select("invited_at, last_sign_in_at").eq("id", id).maybeSingle();
  if (!p?.invited_at || p.last_sign_in_at) return { ok: false, error: "not_found" };
  const { error } = await supabaseAdmin().auth.admin.deleteUser(id);
  if (error) return { ok: false, error: "invalid" };
  refresh();
  return { ok: true };
}
