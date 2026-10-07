import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionManager } from "@/components/dashboard/content/collection-manager";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { listCollection, type CollectionKey } from "./collections";

/** Server page shell shared by the simple collection modules. */
export async function CollectionPage({
  locale,
  collection,
  sub,
}: {
  locale: string;
  collection: CollectionKey;
  sub: "testimonialsSub" | "teamSub" | "statsSub" | "techLogosSub";
}) {
  setRequestLocale(locale as Locale);
  await requireUser(locale);
  const t = await getTranslations("dash");
  return (
    <>
      <DashPageHeader title={t(`sections.${collection}`)} subtitle={t(`content.${sub}`)} />
      <CollectionManager collection={collection} items={await listCollection(collection)} />
    </>
  );
}
