import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dashboard/repo";
import type { Profile, Role } from "@/lib/dashboard/types";

/**
 * TEMPORARY session layer until Supabase Auth (backend phase).
 * A signed, httpOnly cookie holds the user id. Development-only logins (see auth actions).
 * `requireUser()` is the single gate every dashboard page and server action calls.
 */

export const SESSION_COOKIE = "codex-session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // seconds
const SECRET =
  process.env.SESSION_SECRET ??
  (process.env.NODE_ENV === "production" ? "" : "codex-dev-only-secret-change-me");
const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };

const sign = (value: string) => {
  if (!SECRET) throw new Error("SESSION_SECRET must be set in production");
  return createHmac("sha256", SECRET).update(value).digest("base64url");
};

/** Token = `<userId>.<issuedAt>.<hmac>` — signed and time-limited. */
export function encodeSession(userId: string) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000)}`;
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string | undefined): string | null {
  if (!token || token.length > 300) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const payload = token.slice(0, i);
  const a = Buffer.from(token.slice(i + 1));
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const j = payload.lastIndexOf(".");
  const issued = Number(payload.slice(j + 1));
  if (!Number.isFinite(issued) || Date.now() / 1000 - issued > SESSION_MAX_AGE) return null;
  return payload.slice(0, j);
}

export async function getSessionUser(): Promise<Profile | null> {
  const id = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const user = await getUser(id);
  return user?.active ? user : null;
}

export const hasRole = (user: Pick<Profile, "role">, min: Role) => RANK[user.role] >= RANK[min];

/** For pages: redirects to login when signed out, and to the overview when the role is too low. */
export async function requireUser(locale: string, min: Role = "viewer"): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (!hasRole(user, min)) redirect(`/${locale}/dashboard?denied=1`);
  return user;
}

/** Variant for server actions: never redirects, returns null when not allowed. */
export async function authorize(min: Role = "viewer"): Promise<Profile | null> {
  const user = await getSessionUser();
  return user && hasRole(user, min) ? user : null;
}
