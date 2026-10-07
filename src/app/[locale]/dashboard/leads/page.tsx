import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeadPanel } from "@/components/dashboard/leads/lead-panel";
import { LeadsBoard } from "@/components/dashboard/leads/leads-board";
import { LeadsTable } from "@/components/dashboard/leads/leads-table";
import { LeadsToolbar } from "@/components/dashboard/leads/leads-toolbar";
import { DashButton } from "@/components/dashboard/ui/dash-button";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { Card } from "@/components/dashboard/ui/primitives";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { boardLeads, getLead, listLeads, listUsers } from "@/lib/dashboard/repo";
import { LEAD_STATUSES, type LeadService, type LeadStatus } from "@/lib/dashboard/types";
import { LEAD_SERVICES } from "@/lib/schemas/lead";

export const metadata: Metadata = { title: "Leads" };

const SORTS = ["created_at", "name", "estimated_value", "status"] as const;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LeadsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/dashboard/leads">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await requireUser(locale);
  const sp = await searchParams;
  const t = await getTranslations("dash.leads");

  const view = one(sp.view) === "table" ? "table" : "board";
  const q = one(sp.q)?.slice(0, 100) || undefined;
  const status = (one(sp.status) ?? "")
    .split(",")
    .filter((s): s is LeadStatus => (LEAD_STATUSES as readonly string[]).includes(s));
  const svc = one(sp.service);
  const service = (LEAD_SERVICES as readonly string[]).includes(svc ?? "")
    ? (svc as LeadService)
    : null;
  const sortRaw = one(sp.sort);
  const sort = (SORTS as readonly string[]).includes(sortRaw ?? "")
    ? (sortRaw as (typeof SORTS)[number])
    : "created_at";
  const dir = one(sp.dir) === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const pageSize = 20;
  const leadId = one(sp.lead);

  const [users, detail, board, table] = await Promise.all([
    listUsers(),
    leadId ? getLead(leadId) : Promise.resolve(null),
    view === "board" ? boardLeads() : Promise.resolve([]),
    view === "table"
      ? listLeads({ q, status, service, sort, dir, page, pageSize })
      : Promise.resolve({ rows: [], total: 0 }),
  ]);

  // Board honours the same filters, client-side over the full pipeline.
  const boardRows = board.filter(
    (l) =>
      (!q ||
        [l.name, l.email, l.company ?? ""].some((v) =>
          v.toLowerCase().includes(q.toLowerCase()),
        )) &&
      (!status.length || status.includes(l.status)) &&
      (!service || l.service === service),
  );
  const empty =
    view === "board" ? board.length === 0 : table.total === 0 && !q && !status.length && !service;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-headline font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("subtitle")}</p>
      </div>
      <LeadsToolbar view={view} />
      {empty ? (
        <Card>
          <EmptyState
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={
              <DashButton asChild variant="primary">
                <a href={`/${locale}/contact`} target="_blank" rel="noopener noreferrer">
                  {t("openSite")}
                </a>
              </DashButton>
            }
          />
        </Card>
      ) : view === "board" ? (
        <LeadsBoard leads={boardRows} users={users} />
      ) : (
        <LeadsTable
          rows={table.rows}
          total={table.total}
          page={page}
          pageSize={pageSize}
          sort={sort}
          dir={dir}
          users={users}
        />
      )}
      <LeadPanel detail={detail} users={users} />
    </div>
  );
}
