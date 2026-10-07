import "server-only";
import type { MediaRow, PostRow, ProjectRow } from "@/content/types";
import type { LeadInput, LeadMeta } from "@/lib/schemas/lead";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { LEAD_STATUSES, RANGE_DAYS, type SiteSettings, type Activity, type DateRange, type Lead, type LeadNote, type LeadService, type LeadStatus, type Profile } from "./types";

/**
 * Dashboard data access on Supabase. Everything runs AS THE SIGNED-IN USER (server client),
 * so Row Level Security enforces viewer/editor/admin in the database. The activity log and
 * lead timeline are written by database triggers. Only website leads use the service role.
 */

const DAY = 86_400_000;
const sb = () => supabaseServer();
const iso = (ms: number) => new Date(ms).toISOString();
const sinceIso = (range: DateRange, offset = 0) => iso(Date.now() - RANGE_DAYS[range] * (1 + offset) * DAY);

/* ---------------------------------------------------------------- users & activity */

export async function listUsers(): Promise<Profile[]> {
  const { data } = await (await sb()).from("profiles").select("*").eq("active", true).order("full_name");
  return (data ?? []) as Profile[];
}

export async function listAllProfiles(): Promise<Profile[]> {
  const { data } = await (await sb()).from("profiles").select("*").order("created_at");
  return (data ?? []) as Profile[];
}

export async function getUser(id: string): Promise<Profile | null> {
  const { data } = await (await sb()).from("profiles").select("*").eq("id", id).maybeSingle();
  return (data as Profile) ?? null;
}

const toActivity = (a: Record<string, unknown>) => ({ ...a, id: String(a.id) }) as Activity;

export async function recentActivity(limit = 8): Promise<Activity[]> {
  const { data } = await (await sb()).from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map(toActivity);
}

export type ActivityQuery = { entity?: Activity["entity"] | null; actor?: string | null; from?: string | null; to?: string | null; page?: number; pageSize?: number };

export async function listActivity(q: ActivityQuery = {}): Promise<{ rows: Activity[]; total: number }> {
  const { entity, actor, from, to, page = 1, pageSize = 25 } = q;
  let query = (await sb()).from("activity_log").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (entity) query = query.eq("entity", entity);
  if (actor) query = actor === "system" ? query.is("actor_id", null) : query.eq("actor_id", actor);
  if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59Z`);
  const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  return { rows: (data ?? []).map(toActivity), total: count ?? 0 };
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

/** Strip characters that have meaning in PostgREST filter syntax. */
const term = (s: string) => s.replace(/[%,()*\\:"]/g, " ").trim().slice(0, 80);

export async function listLeads(query: LeadQuery = {}): Promise<{ rows: Lead[]; total: number }> {
  const { page = 1, pageSize = 20, q, status, service, sort = "created_at", dir = "desc" } = query;
  let req = (await sb()).from("leads").select("*", { count: "exact" });
  const t = q ? term(q) : "";
  if (t) req = req.or(`name.ilike.%${t}%,email.ilike.%${t}%,company.ilike.%${t}%,phone.ilike.%${t}%`);
  if (status?.length) req = req.in("status", status);
  if (service) req = req.eq("service", service);
  req = req.order(sort, { ascending: dir === "asc", nullsFirst: false });
  const { data, count } = await req.range((page - 1) * pageSize, page * pageSize - 1);
  return { rows: (data ?? []) as Lead[], total: count ?? 0 };
}

export async function boardLeads(): Promise<Lead[]> {
  const { data } = await (await sb()).from("leads").select("*").order("position").limit(500);
  return (data ?? []) as Lead[];
}

export async function getLead(id: string): Promise<{ lead: Lead; notes: LeadNote[] } | null> {
  const client = await sb();
  const [{ data: lead }, { data: notes }] = await Promise.all([
    client.from("leads").select("*").eq("id", id).maybeSingle(),
    client.from("lead_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
  ]);
  return lead ? { lead: lead as Lead, notes: (notes ?? []) as LeadNote[] } : null;
}

/** Website contact form → lead (service role: there is deliberately no anon insert policy). */
export async function createLead(input: LeadInput, meta: LeadMeta & { country?: string | null }): Promise<Lead> {
  const { data, error } = await supabaseAdmin()
    .from("leads")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company || null,
      service: input.service,
      budget: input.budget,
      message: input.message,
      locale: meta.locale,
      country: meta.country ?? null,
      source_page: meta.sourcePage?.slice(0, 300) ?? null,
      utm: meta.utm && Object.keys(meta.utm).length ? meta.utm : null,
      position: -Math.floor(Date.now() / 1000),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Lead;
}

export type LeadPatch = Partial<Pick<Lead, "status" | "assigned_to" | "estimated_value" | "position">>;

export async function updateLead(id: string, patch: LeadPatch) {
  return (await sb()).from("leads").update(patch).eq("id", id).select().maybeSingle();
}

/** Persist one kanban column's order (and status for moved cards). */
export async function reorderColumn(status: LeadStatus, orderedIds: string[]) {
  const client = await sb();
  const results = await Promise.all(orderedIds.map((id, i) => client.from("leads").update({ status, position: i }).eq("id", id)));
  return results.find((r) => r.error)?.error ?? null;
}

export async function addLeadNote(id: string, body: string, authorId: string) {
  return (await sb()).from("lead_notes").insert({ lead_id: id, author_id: authorId, kind: "note", body });
}

export async function deleteLeads(ids: string[]) {
  const { count, error } = await (await sb()).from("leads").delete({ count: "exact" }).in("id", ids);
  return { count: count ?? 0, error };
}

export async function leadsSince(isoTime: string) {
  const { data } = await (await sb()).from("leads").select("id, name, service, created_at").gt("created_at", isoTime).order("created_at", { ascending: false });
  return data ?? [];
}

export async function recentLeads(limit = 6): Promise<Lead[]> {
  const { data } = await (await sb()).from("leads").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Lead[];
}

/* ---------------------------------------------------------------- analytics */

const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));

type Daily = { day: string; views: number; visitors: number; contact_views: number };
async function daily(days: number): Promise<Daily[]> {
  const { data } = await (await sb()).rpc("analytics_daily", { p_days: days });
  return (data ?? []).map((d) => ({ day: d.day, views: Number(d.views), visitors: Number(d.visitors), contact_views: Number(d.contact_views) }));
}
async function breakdown(days: number, dim: "path" | "referrer" | "locale" | "device") {
  const { data } = await (await sb()).rpc("analytics_breakdown", { p_days: days, p_dimension: dim });
  return (data ?? []).map((d) => ({ label: d.label, value: Number(d.value) }));
}

export async function overviewKpis(range: DateRange) {
  const days = RANGE_DAYS[range];
  const client = await sb();
  const [cur, prev, open, projects, views] = await Promise.all([
    client.from("leads").select("status").gte("created_at", sinceIso(range)),
    client.from("leads").select("status").gte("created_at", sinceIso(range, 1)).lt("created_at", sinceIso(range)),
    client.from("leads").select("estimated_value").not("status", "in", "(won,lost)"),
    client.from("projects").select("id", { count: "exact", head: true }).eq("status", "published"),
    daily(days * 2),
  ]);
  const rate = (ls: { status: string }[]) => {
    const closed = ls.filter((l) => l.status === "won" || l.status === "lost");
    return closed.length ? Math.round((ls.filter((l) => l.status === "won").length / closed.length) * 100) : 0;
  };
  const c = cur.data ?? [];
  const p = prev.data ?? [];
  const viewsNow = views.slice(-days).reduce((s, d) => s + d.views, 0);
  const viewsPrev = views.slice(0, -days).reduce((s, d) => s + d.views, 0);
  return {
    newLeads: { value: c.length, delta: pct(c.length, p.length) },
    conversion: { value: rate(c), delta: rate(c) - rate(p) },
    pipeline: { value: (open.data ?? []).reduce((s, l) => s + (l.estimated_value ?? 0), 0), delta: 0 },
    pageViews: { value: viewsNow, delta: pct(viewsNow, viewsPrev) },
    publishedProjects: { value: projects.count ?? 0, delta: 0 },
  };
}

export async function leadsSeries(range: DateRange) {
  const days = RANGE_DAYS[range];
  const [{ data: leads }, views] = await Promise.all([(await sb()).from("leads").select("created_at").gte("created_at", sinceIso(range)), daily(days)]);
  return views.map((d) => ({ date: d.day, views: d.views, leads: (leads ?? []).filter((l) => l.created_at.slice(0, 10) === d.day).length }));
}

export async function leadsByService(range: DateRange) {
  const { data } = await (await sb()).from("leads").select("service").gte("created_at", sinceIso(range));
  const counts = new Map<LeadService, number>();
  (data ?? []).forEach((l) => counts.set(l.service as LeadService, (counts.get(l.service as LeadService) ?? 0) + 1));
  return [...counts.entries()].map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count);
}

export async function trafficByPage(range: DateRange) {
  return (await breakdown(RANGE_DAYS[range], "path")).map((r) => ({ page: r.label, views: r.value }));
}

export async function trafficByDevice(range: DateRange) {
  return (await breakdown(RANGE_DAYS[range], "device")).map((r) => ({ device: r.label as "desktop" | "mobile" | "tablet", views: r.value }));
}

export async function analytics(range: DateRange) {
  const days = RANGE_DAYS[range];
  const [series, pages, referrers, locales, devices, leads] = await Promise.all([
    daily(days),
    breakdown(days, "path"),
    breakdown(days, "referrer"),
    breakdown(days, "locale"),
    breakdown(days, "device"),
    (await sb()).from("leads").select("id", { count: "exact", head: true }).gte("created_at", sinceIso(range)),
  ]);
  const sum = (k: keyof Daily) => series.reduce((s, d) => s + Number(d[k]), 0);
  const views = sum("views");
  const contact = sum("contact_views");
  return {
    totals: { visitors: sum("visitors"), views, contact, leads: leads.count ?? 0 },
    series: series.map((d) => ({ date: d.day, views: d.views, visitors: d.visitors })),
    pages: pages.slice(0, 8),
    referrers: referrers.slice(0, 8),
    locales,
    devices,
    funnel: [
      { key: "views", value: views },
      { key: "contact", value: contact },
      { key: "leads", value: leads.count ?? 0 },
    ] as const,
  };
}

export { LEAD_STATUSES };

/* ---------------------------------------------------------------- content admin reads (RLS: staff see drafts) */


export async function allProjects(): Promise<ProjectRow[]> {
  const { data } = await (await sb()).from("projects").select("*").order("sort_order");
  return (data ?? []) as unknown as ProjectRow[];
}
export async function projectById(id: string): Promise<ProjectRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await (await sb()).from("projects").select("*").eq("id", id).maybeSingle();
  return (data as unknown as ProjectRow) ?? null;
}
export async function allPosts(): Promise<PostRow[]> {
  const { data } = await (await sb()).from("posts").select("*").order("published_at", { ascending: false });
  return (data ?? []) as unknown as PostRow[];
}
export async function postById(id: string): Promise<PostRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await (await sb()).from("posts").select("*").eq("id", id).maybeSingle();
  return (data as unknown as PostRow) ?? null;
}
export async function settingsRow(): Promise<SiteSettings> {
  const { data } = await (await sb()).from("site_settings").select("*").eq("id", 1).single();
  return data as unknown as SiteSettings;
}
export async function allMedia(): Promise<MediaRow[]> {
  const { data } = await (await sb()).from("media").select("*").order("created_at", { ascending: false });
  return (data ?? []) as unknown as MediaRow[];
}
