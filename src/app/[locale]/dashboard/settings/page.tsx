import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsForm } from "@/components/dashboard/admin/settings-form";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/dashboard/mock-db";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ params }: PageProps<"/[locale]/dashboard/settings">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await requireUser(locale, "editor");
  const t = await getTranslations("dash.settings");
  const s = db.settings;
  return (
    <>
      <DashPageHeader title={t("title")} subtitle={t("subtitle")} />
      <SettingsForm
        initial={{
          email: s.email,
          phone: s.phone,
          whatsapp: s.whatsapp,
          address: { en: s.address_en, ar: s.address_ar },
          socials: { ...s.socials },
          seo_title: { en: s.seo_title_en, ar: s.seo_title_ar },
          seo_description: { en: s.seo_description_en, ar: s.seo_description_ar },
          announcement_enabled: s.announcement_enabled,
          announcement: { en: s.announcement_en, ar: s.announcement_ar },
          announcement_href: s.announcement_href,
          maintenance: s.maintenance,
        }}
      />
    </>
  );
}
