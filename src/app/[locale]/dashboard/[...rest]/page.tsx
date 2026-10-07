import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { DashButton } from "@/components/dashboard/ui/dash-button";
import { Card } from "@/components/dashboard/ui/primitives";
import { Link } from "@/i18n/navigation";

/** Modules scheduled for phases 7–8 land here until they're built. */
export default async function ComingSoon() {
  const t = await getTranslations("dash.common");
  return (
    <Card>
      <EmptyState
        title={t("comingSoonTitle")}
        body={t("comingSoon")}
        action={
          <DashButton asChild variant="primary">
            <Link href="/dashboard">{t("backToOverview")}</Link>
          </DashButton>
        }
      />
    </Card>
  );
}
