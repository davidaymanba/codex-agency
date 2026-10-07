"use server";

import { authorize } from "@/lib/auth/session";
import { db } from "@/lib/dashboard/mock-db";
import { logActivity } from "@/lib/dashboard/repo";
import { revalidatePublic } from "@/lib/dashboard/revalidate";
import { settingsSchema } from "@/lib/schemas/settings";

export type SettingsResult =
  | { ok: true }
  | { ok: false; error: "forbidden" | "invalid"; issues?: { path: string; message: string }[] };

/** Save site settings (editor+). Turning maintenance mode on/off is admin-only. */
export async function saveSettings(values: unknown): Promise<SettingsResult> {
  const user = await authorize("editor");
  if (!user) return { ok: false, error: "forbidden" };
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success)
    return {
      ok: false,
      error: "invalid",
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    };
  const v = parsed.data;
  if (v.maintenance !== db.settings.maintenance && user.role !== "admin")
    return { ok: false, error: "forbidden" };

  Object.assign(db.settings, {
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
    updated_at: new Date().toISOString(),
  });
  await logActivity({
    actor_id: user.id,
    action: "settings",
    entity: "settings",
    entity_id: null,
    summary: `${user.full_name} updated site settings`,
    meta: { actor: user.full_name },
  });
  revalidatePublic();
  return { ok: true };
}
