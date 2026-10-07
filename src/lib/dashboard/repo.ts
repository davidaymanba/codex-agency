import "server-only";
import type { LeadInput, LeadMeta } from "@/lib/schemas/lead";
import { db, uid } from "./mock-db";
import {
  LEAD_STATUSES,
  RANGE_DAYS,
  type Activity,
  type DateRange,
  type Lead,
  type LeadNote,
  type LeadService,
  type LeadStatus,
  type Profile,
} from "./types";

/**
 * Dashboard data access. Every function is async and returns plain rows so the bodies can be
 * swapped for Supabase queries (RLS-protected) in the backend phase without touching the UI.
 */

const DAY = 86_400_000;
const since = (range: DateRange, offset = 0) => Date.now() - RANGE_DAYS[range] * (1 + offset) * DAY;
const inRange = (iso: string, range: DateRange, offset = 0) => {
  const t = new Date(iso).getTime();
  return t >= since(range, offset) && t < (offset ? since(range, offset - 1) : Infinity);
};

/* ---------------------------------------------------------------- users & activity */

export async function listUsers(): Promise<Profile[]> {
  return db.profiles.filter((p) => p.active);
}

export async function getUser(id: string): Promise<Profile | null> {
  return db.profiles.find((p) => p.id === id) ?? null;
}

export async function logActivity(a: Omit<Activity, "id" | "created_at">) {
  db.activity.unshift({ ...a, id: uid("act"), created_at: new Date().toISOString() });
}

export async function recentActivity(limit = 8): Promise<Activity[]> {
  return db.activity.slice(0, limit);
}

/* ---------------------------------------------------------------- leads */

export type LeadQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: LeadStatus[];
  service?: LeadService | null;
  sort?: "created_at" | "name" | "estimated_value" | "status";
  dir?: "asc" | "desc";
};

export async function listLeads(query: LeadQuery = {}): Promise<{ rows: Lead[]; total: number }> {
  const { page = 1, pageSize = 20, q, status, service, sort = "created_at", dir = "desc" } = query;
  let rows = db.leads.slice();
  if (q) {
    const s = q.toLowerCase();
    rows = rows.filter((l) =>
      [l.name, l.email, l.company ?? "", l.phone].some((v) => v.toLowerCase().includes(s)),
    );
  }
  if (status?.length) rows = rows.filter((l) => status.includes(l.status));
  if (service) rows = rows.filter((l) => l.service === service);
  rows.sort((a, b) => {
    const av = sort === "status" ? LEAD_STATUSES.indexOf(a.status) : (a[sort] ?? 0);
    const bv = sort === "status" ? LEAD_STATUSES.indexOf(b.status) : (b[sort] ?? 0);
    const c = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === "asc" ? c : -c;
  });
  const total = rows.length;
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total };
}

/** All leads for the kanban (ordered by column position). */
export async function boardLeads(): Promise<Lead[]> {
  return db.leads.slice().sort((a, b) => a.position - b.position);
}

export async function getLead(id: string): Promise<{ lead: Lead; notes: LeadNote[] } | null> {
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return null;
  const notes = db.notes
    .filter((n) => n.lead_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { lead, notes };
}

export async function createLead(input: LeadInput, meta: LeadMeta): Promise<Lead> {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: uid("lead"),
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company || null,
    service: input.service,
    budget: input.budget,
    message: input.message,
    locale: meta.locale,
    country: "SA",
    source_page: meta.sourcePage ?? null,
    utm: meta.utm && Object.keys(meta.utm).length ? meta.utm : null,
    status: "new",
    assigned_to: null,
    estimated_value: null,
    position: Math.min(0, ...db.leads.map((l) => l.position)) - 1,
    created_at: now,
    updated_at: now,
  };
  db.leads.unshift(lead);
  db.notes.push({
    id: uid("note"),
    lead_id: lead.id,
    author_id: null,
    kind: "created",
    body: "Lead created from the website contact form.",
    created_at: now,
  });
  await logActivity({
    actor_id: null,
    action: "create",
    entity: "lead",
    entity_id: lead.id,
    summary: `New lead: ${lead.name}`,
    meta: { name: lead.name },
  });
  return lead;
}

export type LeadPatch = Partial<
  Pick<Lead, "status" | "assigned_to" | "estimated_value" | "position">
>;

export async function updateLead(
  id: string,
  patch: LeadPatch,
  actorId: string,
): Promise<Lead | null> {
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return null;
  const now = new Date().toISOString();
  const actor = await getUser(actorId);
  if (patch.status && patch.status !== lead.status) {
    db.notes.push({
      id: uid("note"),
      lead_id: id,
      author_id: actorId,
      kind: "status",
      body: `${lead.status} → ${patch.status}`,
      created_at: now,
    });
    await logActivity({
      actor_id: actorId,
      action: "status",
      entity: "lead",
      entity_id: id,
      summary: `${actor?.full_name ?? "Someone"} moved ${lead.name} to ${patch.status}`,
      meta: { actor: actor?.full_name ?? "—", name: lead.name, status: patch.status },
    });
  }
  if (patch.assigned_to !== undefined && patch.assigned_to !== lead.assigned_to) {
    const who = patch.assigned_to ? (await getUser(patch.assigned_to))?.full_name : "nobody";
    db.notes.push({
      id: uid("note"),
      lead_id: id,
      author_id: actorId,
      kind: "assign",
      body: `Assigned to ${who}`,
      created_at: now,
    });
    await logActivity({
      actor_id: actorId,
      action: "assign",
      entity: "lead",
      entity_id: id,
      summary: `${lead.name} assigned to ${who}`,
      meta: { name: lead.name, who: who ?? "—" },
    });
  }
  Object.assign(lead, patch, { updated_at: now });
  return lead;
}

/** Reorder after a kanban drop: write the new order of one column. */
export async function reorderColumn(status: LeadStatus, orderedIds: string[]) {
  orderedIds.forEach((id, i) => {
    const l = db.leads.find((x) => x.id === id);
    if (l) {
      l.status = status;
      l.position = i;
    }
  });
}

export async function addLeadNote(id: string, body: string, actorId: string): Promise<LeadNote> {
  const note: LeadNote = {
    id: uid("note"),
    lead_id: id,
    author_id: actorId,
    kind: "note",
    body,
    created_at: new Date().toISOString(),
  };
  db.notes.push(note);
  await logActivity({
    actor_id: actorId,
    action: "note",
    entity: "lead",
    entity_id: id,
    summary: `Note added on ${db.leads.find((l) => l.id === id)?.name}`,
    meta: { name: db.leads.find((l) => l.id === id)?.name ?? "—" },
  });
  return note;
}

export async function deleteLeads(ids: string[], actorId: string): Promise<number> {
  const before = db.leads.length;
  db.leads = db.leads.filter((l) => !ids.includes(l.id));
  db.notes = db.notes.filter((n) => !ids.includes(n.lead_id));
  const removed = before - db.leads.length;
  await logActivity({
    actor_id: actorId,
    action: "delete",
    entity: "lead",
    entity_id: null,
    summary: `${removed} lead(s) deleted`,
    meta: { count: String(removed) },
  });
  return removed;
}

export async function leadsSince(iso: string): Promise<Lead[]> {
  return db.leads
    .filter((l) => l.created_at > iso)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/* ---------------------------------------------------------------- analytics */

const pct = (cur: number, prev: number) =>
  prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

export async function overviewKpis(range: DateRange) {
  const cur = db.leads.filter((l) => inRange(l.created_at, range));
  const prev = db.leads.filter((l) => inRange(l.created_at, range, 1));
  const views = db.pageViews.slice(-RANGE_DAYS[range]).reduce((s, d) => s + d.views, 0);
  const prevViews = db.pageViews
    .slice(-RANGE_DAYS[range] * 2, -RANGE_DAYS[range])
    .reduce((s, d) => s + d.views, 0);
  const closed = (ls: Lead[]) => ls.filter((l) => l.status === "won" || l.status === "lost");
  const rate = (ls: Lead[]) => {
    const c = closed(ls);
    return c.length
      ? Math.round((ls.filter((l) => l.status === "won").length / c.length) * 100)
      : 0;
  };
  const pipeline = db.leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((s, l) => s + (l.estimated_value ?? 0), 0);
  return {
    newLeads: { value: cur.length, delta: pct(cur.length, prev.length) },
    conversion: { value: rate(cur), delta: rate(cur) - rate(prev) },
    pipeline: { value: pipeline, delta: 0 },
    pageViews: { value: views, delta: pct(views, prevViews) },
    publishedProjects: { value: 6, delta: 0 },
  };
}

export async function leadsSeries(range: DateRange) {
  const days = RANGE_DAYS[range];
  const out: { date: string; leads: number; views: number }[] = [];
  const pv = db.pageViews.slice(-days);
  for (let i = 0; i < days; i++) {
    const date =
      pv[i]?.date ?? new Date(Date.now() - (days - 1 - i) * DAY).toISOString().slice(0, 10);
    out.push({
      date,
      leads: db.leads.filter((l) => l.created_at.slice(0, 10) === date).length,
      views: pv[i]?.views ?? 0,
    });
  }
  return out;
}

export async function leadsByService(range: DateRange) {
  const cur = db.leads.filter((l) => inRange(l.created_at, range));
  const counts = new Map<LeadService, number>();
  cur.forEach((l) => counts.set(l.service, (counts.get(l.service) ?? 0) + 1));
  return [...counts.entries()]
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);
}

export async function trafficByPage(range: DateRange) {
  const totals: Record<string, number> = {};
  db.pageViews
    .slice(-RANGE_DAYS[range])
    .forEach((d) =>
      Object.entries(d.pages).forEach(([p, v]) => (totals[p] = (totals[p] ?? 0) + v)),
    );
  return Object.entries(totals)
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views);
}

export async function trafficByDevice(range: DateRange) {
  const t = { desktop: 0, mobile: 0, tablet: 0 };
  db.pageViews.slice(-RANGE_DAYS[range]).forEach((d) => {
    t.desktop += d.devices.desktop;
    t.mobile += d.devices.mobile;
    t.tablet += d.devices.tablet;
  });
  return (Object.keys(t) as (keyof typeof t)[]).map((device) => ({ device, views: t[device] }));
}

export async function recentLeads(limit = 6): Promise<Lead[]> {
  return db.leads
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export type ActivityQuery = {
  entity?: Activity["entity"] | null;
  actor?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
};

export async function listActivity(
  q: ActivityQuery = {},
): Promise<{ rows: Activity[]; total: number }> {
  const { entity, actor, from, to, page = 1, pageSize = 25 } = q;
  let rows = db.activity.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (entity) rows = rows.filter((a) => a.entity === entity);
  if (actor)
    rows = rows.filter((a) => (actor === "system" ? a.actor_id === null : a.actor_id === actor));
  if (from) rows = rows.filter((a) => a.created_at.slice(0, 10) >= from);
  if (to) rows = rows.filter((a) => a.created_at.slice(0, 10) <= to);
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
}

export async function analytics(range: DateRange) {
  const days = db.pageViews.slice(-RANGE_DAYS[range]);
  const visitors = (d: (typeof days)[number]) => d.sessions.length || Math.round(d.views / 1.6);
  const sum = (f: (d: (typeof days)[number]) => number) => days.reduce((s, d) => s + f(d), 0);
  const merge = (pick: (d: (typeof days)[number]) => Record<string, number>) => {
    const out: Record<string, number> = {};
    days.forEach((d) => Object.entries(pick(d)).forEach(([k, v]) => (out[k] = (out[k] ?? 0) + v)));
    return Object.entries(out)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };
  const leads = db.leads.filter((l) => inRange(l.created_at, range)).length;
  const views = sum((d) => d.views);
  const contact = sum((d) => d.contact_views);
  return {
    totals: { visitors: sum(visitors), views, contact, leads },
    series: days.map((d) => ({ date: d.date, views: d.views, visitors: visitors(d) })),
    pages: merge((d) => d.pages).slice(0, 8),
    referrers: merge((d) => d.referrers ?? {}).slice(0, 8),
    locales: merge((d) => d.locales),
    devices: merge((d) => d.devices),
    funnel: [
      { key: "views", value: views },
      { key: "contact", value: contact },
      { key: "leads", value: leads },
    ] as const,
  };
}
