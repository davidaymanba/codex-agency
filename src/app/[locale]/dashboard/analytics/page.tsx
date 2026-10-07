import { ShieldCheck } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Funnel } from "@/components/dashboard/admin/funnel";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import { HBars, TimeSeries } from "@/components/dashboard/overview/charts";
import { KpiCard } from "@/components/dashboard/overview/kpi-card";
import { RangePicker } from "@/components/dashboard/overview/range-picker";
import { Stagger, StaggerItem } from "@/components/dashboard/overview/stagger";
import { Card, CardHeader } from "@/components/dashboard/ui/primitives";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { analytics } from "@/lib/dashboard/repo";
import type { DateRange } from "@/lib/dashboard/types";

export const metadata = { title: "Analytics" };
const RANGES: DateRange[] = ["7d", "30d", "90d"];

export default async function AnalyticsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/analytics">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await requireUser(locale);
  const raw = (await searchParams).range;
  const range: DateRange = RANGES.includes(raw as DateRange) ? (raw as DateRange) : "30d";
  const [t, to, format] = await Promise.all([
    getTranslations("dash.analytics"),
    getTranslations("dash.overview"),
    getFormatter(),
  ]);
  const a = await analytics(range);
  const localeLabel = (l: string) => (l === "ar" ? "العربية" : "English");

  return (
    <>
      <DashPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={<RangePicker value={range} />}
      />
      <Stagger className="space-y-6">
        <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={t("visitors")} value={a.totals.visitors} format="number" deltaLabel="" />
          <KpiCard label={t("views")} value={a.totals.views} format="number" deltaLabel="" />
          <KpiCard
            label={t("contactViews")}
            value={a.totals.contact}
            format="number"
            deltaLabel=""
          />
          <KpiCard label={t("leads")} value={a.totals.leads} format="number" deltaLabel="" />
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader title={t("trafficOverTime")} />
            <div className="p-4">
              <TimeSeries
                data={a.series.map((d) => ({ date: d.date, value: d.views }))}
                seriesLabel={t("views")}
              />
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-xs text-link">{t("table")}</summary>
                <div className="mt-2 max-h-64 overflow-y-auto border border-border">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface text-fg-muted">
                      <tr>
                        <th className="px-3 py-2 text-start font-medium">{t("day")}</th>
                        <th className="px-3 py-2 text-end font-medium">{t("views")}</th>
                        <th className="px-3 py-2 text-end font-medium">{t("visitors")}</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {a.series
                        .slice()
                        .reverse()
                        .map((d) => (
                          <tr key={d.date} className="border-t border-border">
                            <td className="px-3 py-1.5">
                              {format.dateTime(new Date(d.date), {
                                dateStyle: "medium",
                                numberingSystem: "latn",
                              })}
                            </td>
                            <td className="px-3 py-1.5 text-end">{d.views}</td>
                            <td className="px-3 py-1.5 text-end">{d.visitors}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
          <Card>
            <CardHeader title={t("funnel")} />
            <div className="p-5">
              <p className="mb-5 text-sm text-fg-muted">{t("funnelHint")}</p>
              <Funnel
                steps={a.funnel.map((s) => ({ label: t(`step.${s.key}`), value: s.value }))}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title={t("topPages")} />
            <div className="p-4">
              <HBars data={a.pages} valueLabel={t("views")} />
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
          <Card>
            <CardHeader title={t("referrers")} />
            <div className="p-4">
              <HBars data={a.referrers} valueLabel={t("views")} />
            </div>
          </Card>
          <Card>
            <CardHeader title={t("locales")} />
            <div className="p-4">
              <HBars
                data={a.locales.map((l) => ({ label: localeLabel(l.label), value: l.value }))}
                valueLabel={t("views")}
                percent
              />
            </div>
          </Card>
          <Card>
            <CardHeader title={t("devices")} />
            <div className="p-4">
              <HBars
                data={a.devices.map((d) => ({
                  label: to(`devices.${d.label as "mobile"}`),
                  value: d.value,
                }))}
                valueLabel={t("views")}
                percent
              />
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <p className="flex items-center gap-2 text-xs text-fg-muted">
            <ShieldCheck aria-hidden className="size-4 text-link" />
            {t("privacy")}
          </p>
        </StaggerItem>
      </Stagger>
    </>
  );
}
