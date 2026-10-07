import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ActivityFilters } from "@/components/dashboard/admin/activity-filters";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import { Stagger, StaggerItem } from "@/components/dashboard/overview/stagger";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { Avatar, Card } from "@/components/dashboard/ui/primitives";
import { DashButton } from "@/components/dashboard/ui/dash-button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { activityText } from "@/lib/dashboard/activity-text";
import { listActivity, listAllProfiles } from "@/lib/dashboard/repo";
import type { Activity } from "@/lib/dashboard/types";

export const metadata = { title: "Activity log" };

const ENTITIES: Activity["entity"][] = [
  "lead",
  "project",
  "post",
  "content",
  "media",
  "settings",
  "user",
];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const isDate = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export default async function ActivityPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/activity">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await requireUser(locale, "editor");
  const sp = await searchParams;
  const [t, tdash, tl, format] = await Promise.all([
    getTranslations("dash.activityLog"),
    getTranslations("dash"),
    getTranslations("dash.leads"),
    getFormatter(),
  ]);

  const entity = ENTITIES.includes(one(sp.entity) as Activity["entity"])
    ? (one(sp.entity) as Activity["entity"])
    : null;
  const actor = one(sp.actor)?.slice(0, 80) || null;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const pageSize = 25;
  const { rows, total } = await listActivity({
    entity,
    actor,
    from: isDate(one(sp.from)),
    to: isDate(one(sp.to)),
    page,
    pageSize,
  });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const users = (await listAllProfiles()).map((p) => ({ id: p.id, name: p.full_name }));
  const name = (id: string | null) =>
    id ? (users.find((u) => u.id === id)?.name ?? "—") : t("system");

  // Group by day.
  const groups = new Map<string, typeof rows>();
  rows.forEach((a) => {
    const day = a.created_at.slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), a]);
  });
  const qs = (p: number) => {
    const q = new URLSearchParams(
      Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
    );
    q.set("page", String(p));
    return `/dashboard/activity?${q}`;
  };

  return (
    <>
      <DashPageHeader title={t("title")} subtitle={t("subtitle")} />
      <ActivityFilters users={users} />
      {rows.length === 0 ? (
        <Card>
          <EmptyState title={t("empty")} />
        </Card>
      ) : (
        <Stagger className="space-y-6">
          {[...groups.entries()].map(([day, items]) => (
            <StaggerItem key={day}>
              <h2 className="mb-2 label-mono text-fg-muted">
                {format.dateTime(new Date(day), { dateStyle: "full", numberingSystem: "latn" })}
              </h2>
              <Card>
                <ul className="divide-y divide-border">
                  {items.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar
                        name={name(a.actor_id)}
                        className={a.actor_id ? "" : "bg-surface-2 text-fg"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm" dir="auto">
                          {activityText(a, tdash as never, (st) => tl(`statuses.${st as "new"}`))}
                        </p>
                        <p className="text-xs text-fg-muted">
                          {name(a.actor_id)} ·{" "}
                          {format.dateTime(new Date(a.created_at), {
                            timeStyle: "short",
                            numberingSystem: "latn",
                          })}
                        </p>
                      </div>
                      <span className="hidden bg-surface-2 px-1.5 py-0.5 label-mono text-fg-muted sm:inline">
                        {t(`entities.${a.entity}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          <p className="text-fg-muted">{tdash("common.page", { page, pages })}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <DashButton asChild size="sm">
                <Link href={qs(page - 1)}>{tdash("common.prev")}</Link>
              </DashButton>
            )}
            {page < pages && (
              <DashButton asChild size="sm">
                <Link href={qs(page + 1)}>{tdash("common.next")}</Link>
              </DashButton>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
