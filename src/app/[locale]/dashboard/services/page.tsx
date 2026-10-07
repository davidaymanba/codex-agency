import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionManager } from "@/components/dashboard/content/collection-manager";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import { ServicesTabs } from "@/components/dashboard/content/services-tabs";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { listCollection } from "@/lib/dashboard/collections";

export const metadata = { title: "Services & solutions" };

export default async function ServicesAdminPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/services">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await requireUser(locale);
  const t = await getTranslations("dash");
  const tab = (await searchParams).tab === "solutions" ? "solutions" : "services";
  return (
    <>
      <DashPageHeader
        title={t("nav.services")}
        subtitle={t("content.servicesSub")}
        actions={<ServicesTabs value={tab} />}
      />
      <CollectionManager key={tab} collection={tab} items={listCollection(tab)} />
    </>
  );
}
