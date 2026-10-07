"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** Browser client (dashboard only): Realtime subscriptions and direct Storage uploads, as the signed-in user. */
let client: ReturnType<typeof createBrowserClient<Database>> | undefined;
export function supabaseBrowser() {
  return (client ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY));
}
