import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Profile, Role } from "@/lib/dashboard/types";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Supabase Auth session helpers. `requireUser()` (pages) and `authorize()` (server actions)
 * are the app-level gates; RLS in the database is the final one.
 */
const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };

export const getSessionUser = cache(async (): Promise<Profile | null> => {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data?.active) return null;
  return data as Profile;
});

export const hasRole = (user: Pick<Profile, "role">, min: Role) => RANK[user.role] >= RANK[min];

/** For pages: redirects to login when signed out, and to the overview when the role is too low. */
export async function requireUser(locale: string, min: Role = "viewer"): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (!hasRole(user, min)) redirect(`/${locale}/dashboard?denied=1`);
  return user;
}

/** For server actions / route handlers: never redirects, returns null when not allowed. */
export async function authorize(min: Role = "viewer"): Promise<Profile | null> {
  const user = await getSessionUser();
  return user && hasRole(user, min) ? user : null;
}
