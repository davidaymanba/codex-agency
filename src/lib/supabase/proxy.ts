import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Refreshes the Supabase session cookie on every request (runs in the proxy) and returns the
 * verified JWT claims (null when signed out). Cookies are written onto `res`.
 */
export async function updateSession(req: NextRequest, res: NextResponse) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}
