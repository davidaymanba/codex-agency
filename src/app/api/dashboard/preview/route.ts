import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { authorize } from "@/lib/auth/session";

/**
 * Live preview of drafts: signed-in dashboard users enable Next.js draft mode and are sent
 * to the public page. `?exit=1` turns it off again.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dm = await draftMode();
  if (url.searchParams.get("exit")) {
    dm.disable();
    // Only same-site paths ("/x"), never protocol-relative ("//evil.com") — no open redirect.
    const to = url.searchParams.get("to") ?? "/";
    redirect(/^\/(?![\/\\])/.test(to) ? to : "/");
  }
  if (!(await authorize("viewer"))) return new Response("Forbidden", { status: 403 });
  const locale = url.searchParams.get("locale") === "ar" ? "ar" : "en";
  const type = url.searchParams.get("type") === "post" ? "blog" : "work";
  const slug = (url.searchParams.get("slug") ?? "").replace(/[^a-z0-9-]/g, "");
  if (!slug) return new Response("Bad request", { status: 400 });
  dm.enable();
  redirect(`/${locale}/${type}/${slug}`);
}
