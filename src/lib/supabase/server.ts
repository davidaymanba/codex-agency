import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { assertSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Request-scoped client acting AS THE SIGNED-IN USER (cookies). Every query goes through RLS,
 * so the database itself enforces viewer/editor/admin rules for the dashboard.
 */
export async function supabaseServer() {
  assertSupabaseEnv();
  const store = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}
