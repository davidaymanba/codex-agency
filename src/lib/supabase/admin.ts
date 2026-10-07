import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL } from "./env";

/**
 * SERVICE-ROLE client — bypasses RLS. Server-only, used for the few writes the public can't
 * do directly: website leads, page views, rate limits, invitations and draft previews.
 * Never import this from a client component (the "server-only" import enforces it).
 */
let client: ReturnType<typeof createClient<Database>> | undefined;
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server only)");
  return (client ??= createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}

/** Map Postgres / PostgREST errors to the dashboard's error codes. */
export function dbError(e: { code?: string; hint?: string | null; message?: string } | null) {
  if (!e) return null;
  if (e.code === "23505") return "duplicate" as const;
  if (e.code === "42501" || e.code === "PGRST301") return "forbidden" as const;
  if (e.code === "P0001") return (e.hint === "self" || e.hint === "last_admin" ? e.hint : "forbidden") as "self" | "last_admin" | "forbidden";
  if (e.code === "PGRST116") return "not_found" as const;
  return "invalid" as const;
}
