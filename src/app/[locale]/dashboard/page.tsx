import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { HBars, LeadsOverTime } from "@/components/dashboard/overview/charts";
import { KpiCard } from "@/components/dashboard/overview/kpi-card";
import { RangePicker } from "@/components/dashboard/overview/range-picker";
import { Stagger, StaggerItem } from "@/components/dashboard/overview/stagger";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { Avatar, Card, CardHeader } from "@/components/dashboard/ui/primitives";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import {
  leadsByService,
  leadsSeries,
  overviewKpis,
  recentActivity,
  recentLeads,
  trafficByDevice,
  trafficByPage,
} from "@/lib/dashboard/repo";
import type { DateRange } from "@/lib/dashboard/types";
import { activityText } from "@/lib/dashboard/activity-text";

export const metadata: Metadata = { title: "Overview" };

const RANGES: DateRange[] = ["7d", "30d", "90d"];

export default async function OverviewPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const raw = (await searchParams).range;
  const range: DateRange = RANGES.includes(raw as DateRange) ? (raw as DateRange) : "30d";

  const [t, tl, format] = await Promise.all([
    getTranslations("dash.overview"),
    getTranslations("dash.leads"),
    getFormatter(),
  ]);
  const tdash = await getTranslations("dash");
  const describe = (a: (typeof activity)[number]) =>
    activityText(a, tdash as never, (st) => tl(`statuses.${st as "new"}`));
  const [kpis, series, byService, byPage, byDevice, recent, activity] = await Promise.all([
    overviewKpis(range),
    leadsSeries(range),
    leadsByService(range),
    trafficByPage(range),
    trafficByDevice(range),
    recentLeads(6),
    recentActivity(8),
  ]);
  const now = new Date();

  return (
    <Stagger className="space-y-6">
      <StaggerItem className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-headline font-bold">
            {t("greeting", { name: user.full_name.split(" ")[0] })}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{t("subtitle")}</p>
        </div>
        <RangePicker value={range} />
      </StaggerItem>

      <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label={t("kpi.newLeads")}
          value={kpis.newLeads.value}
          format="number"
          delta={kpis.newLeads.delta}
          deltaLabel={t("vsPrev")}
        />
        <KpiCard
          label={t("kpi.conversion")}
          value={kpis.conversion.value}
          format="percent"
          delta={kpis.conversion.delta}
          deltaSuffix="pt"
          deltaLabel={t("vsPrev")}
        />
        <KpiCard
          label={t("kpi.pipeline")}
          value={kpis.pipeline.value}
          format="currency"
          deltaLabel={t("vsPrev")}
        />
        <KpiCard
          label={t("kpi.pageViews")}
          value={kpis.pageViews.value}
          format="number"
          delta={kpis.pageViews.delta}
          deltaLabel={t("vsPrev")}
        />
        <KpiCard
          label={t("kpi.published")}
          value={kpis.publishedProjects.value}
          format="number"
          deltaLabel={t("vsPrev")}
        />
      </StaggerItem>

      <StaggerItem className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader title={t("leadsOverTime")} />
          <div className="p-4">
            <LeadsOverTime data={series} seriesLabel={t("leads")} />
          </div>
        </Card>
        <Card>
          <CardHeader title={t("leadsByService")} />
          <div className="p-4">
            {byService.length ? (
              <HBars
                data={byService.map((s) => ({
                  label: tl(`services.${s.service}`),
                  value: s.count,
                }))}
                valueLabel={t("leads")}
              />
            ) : (
              <EmptyState title={tl("emptyTitle")} />
            )}
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader title={t("trafficByPage")} />
          <div className="p-4">
            <HBars
              data={byPage.slice(0, 7).map((p) => ({ label: p.page, value: p.views }))}
              valueLabel={t("views")}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title={t("trafficByDevice")} />
          <div className="p-4">
            <HBars
              data={byDevice.map((d) => ({ label: t(`devices.${d.device}`), value: d.views }))}
              valueLabel={t("views")}
              percent
            />
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader
            title={t("recentLeads")}
            action={
              <Link
                href="/dashboard/leads"
                className="inline-flex items-center gap-1 text-xs text-link hover:underline"
              >
                {t("viewAll")}
                <ArrowUpRight aria-hidden className="size-3.5 rtl:-scale-x-100" />
              </Link>
            }
          />
          {recent.length ? (
            <ul className="divide-y divide-border">
              {recent.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/dashboard/leads?lead=${l.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                  >
                    <Avatar name={l.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{l.name}</span>
                      <span className="block truncate text-xs text-fg-muted">
                        {tl(`services.${l.service}`)} · {l.company ?? l.email}
                      </span>
                    </span>
                    <StatusBadge status={l.status} label={tl(`statuses.${l.status}`)} />
                    <span className="hidden w-24 text-end text-xs text-fg-muted sm:block">
                      {format.relativeTime(new Date(l.created_at), now)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={tl("emptyTitle")} body={tl("emptyBody")} />
          )}
        </Card>
        <Card>
          <CardHeader title={t("recentActivity")} />
          <ol className="relative space-y-4 p-5 before:absolute before:inset-y-6 before:start-[1.6rem] before:w-px before:bg-border">
            {activity.map((a) => (
              <li key={a.id} className="relative flex gap-3 ps-0">
                <span
                  aria-hidden
                  className="relative z-10 mt-1 size-2.5 shrink-0 border-2 border-surface bg-link outline outline-1 outline-border"
                />
                <span className="min-w-0">
                  <span className="block text-sm">{describe(a)}</span>
                  <span className="block text-xs text-fg-muted">
                    {format.relativeTime(new Date(a.created_at), now)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </StaggerItem>
    </Stagger>
  );
}
