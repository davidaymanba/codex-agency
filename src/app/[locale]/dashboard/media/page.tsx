import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import { MediaLibrary } from "@/components/dashboard/media/media-library";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/dashboard/mock-db";

export const metadata = { title: "Media library" };

export default async function MediaPage({ params }: PageProps<"/[locale]/dashboard/media">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await requireUser(locale);
  const t = await getTranslations("dash.media");
  const items = db.media.map((m) => ({
    id: m.id,
    url: m.url,
    filename: m.filename,
    size: m.size,
    mime: m.mime,
    alt_en: m.alt_en,
    alt_ar: m.alt_ar,
    created_at: m.created_at,
  }));
  return (
    <>
      <DashPageHeader title={t("title")} subtitle={t("subtitle")} />
      <MediaLibrary items={items} />
    </>
  );
}
