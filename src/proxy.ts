import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/proxy";

const intl = createMiddleware(routing);
const DASHBOARD = /^\/(en|ar)\/dashboard(?:\/|$)/;

/**
 * 1. next-intl locale routing.
 * 2. Supabase session refresh (cookie rotation) on every page request.
 * 3. Optimistic guard: no valid session on /{locale}/dashboard → login (with ?next=).
 *    The role is re-checked by `requireUser()` and by RLS on every query.
 */
export default async function proxy(req: NextRequest) {
  const res = intl(req);
  if (res.headers.get("location")) return res; // locale redirect — nothing else to do
  const claims = await updateSession(req, res);
  const m = req.nextUrl.pathname.match(DASHBOARD);
  if (m && !claims) {
    const url = new URL(`/${m[1]}/login`, req.url);
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  // Skip API routes, Next internals, and any path with a file extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
