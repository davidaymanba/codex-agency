import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["invite", "magiclink", "recovery", "email", "signup", "email_change"];

/**
 * Landing route for every auth email (invite / magic link / recovery). Verifies the one-time
 * token, sets the session cookie, then sends the user on (same-site paths only).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const rawNext = url.searchParams.get("next") ?? "/en/dashboard";
  const next = /^\/(en|ar)\//.test(rawNext) && !rawNext.startsWith("//") ? rawNext : "/en/dashboard";
  const locale = next.slice(1, 3);

  if (tokenHash && type && TYPES.includes(type)) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const dest = type === "invite" ? `/${locale}/accept-invite` : type === "recovery" ? `/${locale}/reset-password` : next;
      return NextResponse.redirect(new URL(dest, url.origin));
    }
  }
  return NextResponse.redirect(new URL(`/${locale}/login?error=link`, url.origin));
}
