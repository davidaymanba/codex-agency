"use client";

import { useTranslations } from "next-intl";
import { DashButton } from "@/components/dashboard/ui/dash-button";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { Card } from "@/components/dashboard/ui/primitives";

/** Friendly error state for any dashboard route. */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("dash.common");
  return (
    <Card>
      <EmptyState
        title={t("error")}
        action={
          <DashButton variant="primary" onClick={reset}>
            {t("retry")}
          </DashButton>
        }
      />
    </Card>
  );
}
