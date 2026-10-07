import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const SESSION_COOKIE = "codex-session";
const DASHBOARD = /^\/(en|ar)\/dashboard(?:\/|$)/;

/**
 * 1. Optimistic guard: no session cookie on /{locale}/dashboard → login (with ?next=).
 *    The signature + role are verified again in the dashboard layout and in every server action.
 * 2. next-intl locale routing for everything else.
 * Backend phase: add Supabase session refresh here.
 */
export default function proxy(req: NextRequest) {
  const m = req.nextUrl.pathname.match(DASHBOARD);
  if (m && !req.cookies.get(SESSION_COOKIE)) {
    const url = new URL(`/${m[1]}/login`, req.url);
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return intl(req);
}

export const config = {
  // Skip API routes, Next internals, and any path with a file extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
