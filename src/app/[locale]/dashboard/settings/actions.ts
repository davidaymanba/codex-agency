"use server";

import { authorize } from "@/lib/auth/session";
import { revalidatePublic } from "@/lib/dashboard/revalidate";
import { settingsSchema } from "@/lib/schemas/settings";
import { supabaseServer } from "@/lib/supabase/server";

export type SettingsResult = { ok: true } | { ok: false; error: "forbidden" | "invalid"; issues?: { path: string; message: string }[] };

/** Save site settings (editor+). Maintenance mode is admin-only (checked here AND by a DB trigger). */
export async function saveSettings(values: unknown): Promise<SettingsResult> {
  const user = await authorize("editor");
  if (!user) return { ok: false, error: "forbidden" };
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) };
  const v = parsed.data;
  const sb = await supabaseServer();
  const { data: current } = await sb.from("site_settings").select("maintenance").eq("id", 1).single();
  if (current && v.maintenance !== current.maintenance && user.role !== "admin") return { ok: false, error: "forbidden" };

  const { error } = await sb
    .from("site_settings")
    .update({
      email: v.email,
      phone: v.phone,
      whatsapp: v.whatsapp,
      address_en: v.address.en,
      address_ar: v.address.ar,
      socials: v.socials,
      seo_title_en: v.seo_title.en,
      seo_title_ar: v.seo_title.ar,
      seo_description_en: v.seo_description.en,
      seo_description_ar: v.seo_description.ar,
      announcement_enabled: v.announcement_enabled,
      announcement_en: v.announcement.en,
      announcement_ar: v.announcement.ar,
      announcement_href: v.announcement_href,
      maintenance: v.maintenance,
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.code === "P0001" || error.code === "42501" ? "forbidden" : "invalid" };
  revalidatePublic();
  return { ok: true };
}
