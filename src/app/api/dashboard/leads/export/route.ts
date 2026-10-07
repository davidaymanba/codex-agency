import { authorize } from "@/lib/auth/session";
import { listLeads } from "@/lib/dashboard/repo";
import { LEAD_STATUSES, type LeadService, type LeadStatus } from "@/lib/dashboard/types";
import { LEAD_SERVICES } from "@/lib/schemas/lead";

/** CSV export of leads with the current filters. Auth checked here (the proxy skips /api). */
export async function GET(req: Request) {
  if (!(await authorize("viewer"))) return new Response("Forbidden", { status: 403 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.slice(0, 100) || undefined;
  const status = (url.searchParams.get("status") ?? "")
    .split(",")
    .filter((s): s is LeadStatus => (LEAD_STATUSES as readonly string[]).includes(s));
  const svc = url.searchParams.get("service");
  const service = (LEAD_SERVICES as readonly string[]).includes(svc ?? "")
    ? (svc as LeadService)
    : null;
  const { rows } = await listLeads({ q, status, service, pageSize: 10_000 });

  // Neutralise spreadsheet formula injection and quote every cell.
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = [
    "id",
    "created_at",
    "name",
    "email",
    "phone",
    "company",
    "country",
    "service",
    "budget",
    "status",
    "estimated_value",
    "assigned_to",
    "source_page",
    "message",
  ];
  const lines = [
    header.join(","),
    ...rows.map((l) => header.map((h) => cell(l[h as keyof typeof l])).join(",")),
  ];
  // BOM so Excel opens Arabic text correctly.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="codex-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
