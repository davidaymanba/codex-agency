import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { assertSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Cookie-less anon client for the PUBLIC website. No user context → pages stay static/cacheable,
 * and RLS only exposes published content.
 */
let client: ReturnType<typeof createClient<Database>> | undefined;
export function supabasePublic() {
  assertSupabaseEnv();
  return (client ??= createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}
