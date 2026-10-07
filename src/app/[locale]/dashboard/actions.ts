"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize } from "@/lib/auth/session";
import {
  addLeadNote,
  createLead,
  deleteLeads,
  getLead,
  leadsSince,
  listUsers,
  reorderColumn,
  updateLead,
} from "@/lib/dashboard/repo";
import { LEAD_STATUSES } from "@/lib/dashboard/types";
import { LEAD_BUDGETS, LEAD_SERVICES } from "@/lib/schemas/lead";

/**
 * Dashboard mutations. Every action re-checks the caller's role (viewer < editor < admin)
 * before touching data — the UI hiding a button is never the only protection.
 */

type Ok<T = undefined> =
  { ok: true; data?: T } | { ok: false; error: "forbidden" | "invalid" | "not_found" };
const refresh = () => revalidatePath("/[locale]/dashboard", "layout");

const statusSchema = z.enum(LEAD_STATUSES);
const idSchema = z.string().min(1).max(80);

export async function pollLeads(sinceIso: string) {
  if (!(await authorize("viewer"))) return [];
  const since = z.iso.datetime().safeParse(sinceIso);
  if (!since.success) return [];
  return (await leadsSince(since.data)).map((l) => ({
    id: l.id,
    name: l.name,
    service: l.service,
    created_at: l.created_at,
  }));
}

export async function getLeadDetail(id: string) {
  if (!(await authorize("viewer"))) return null;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return null;
  const [detail, users] = await Promise.all([getLead(parsed.data), listUsers()]);
  return detail ? { ...detail, users } : null;
}

export async function moveLead(id: string, status: string, orderedIds: string[]): Promise<Ok> {
  const user = await authorize("editor");
  if (!user) return { ok: false, error: "forbidden" };
  const s = statusSchema.safeParse(status);
  const ids = z.array(idSchema).max(500).safeParse(orderedIds);
  if (!s.success || !ids.success || !idSchema.safeParse(id).success)
    return { ok: false, error: "invalid" };
  const lead = await updateLead(id, { status: s.data }, user.id);
  if (!lead) return { ok: false, error: "not_found" };
  await reorderColumn(s.data, ids.data);
  refresh();
  return { ok: true };
}

const patchSchema = z
  .object({
    status: statusSchema.optional(),
    assigned_to: z.string().max(80).nullable().optional(),
    estimated_value: z.number().int().min(0).max(100_000_000).nullable().optional(),
  })
  .strict();

export async function updateLeadFields(id: string, patch: unknown): Promise<Ok> {
  const user = await authorize("editor");
  if (!user) return { ok: false, error: "forbidden" };
  const p = patchSchema.safeParse(patch);
  if (!p.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  if (p.data.assigned_to && !(await listUsers()).some((u) => u.id === p.data.assigned_to))
    return { ok: false, error: "invalid" };
  const lead = await updateLead(id, p.data, user.id);
  if (!lead) return { ok: false, error: "not_found" };
  refresh();
  return { ok: true };
}

export async function addNote(id: string, body: string): Promise<Ok> {
  const user = await authorize("editor");
  if (!user) return { ok: false, error: "forbidden" };
  const b = z.string().trim().min(1).max(2000).safeParse(body);
  if (!b.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  await addLeadNote(id, b.data, user.id);
  refresh();
  return { ok: true };
}

export async function bulkUpdateStatus(ids: string[], status: string): Promise<Ok> {
  const user = await authorize("editor");
  if (!user) return { ok: false, error: "forbidden" };
  const s = statusSchema.safeParse(status);
  const list = z.array(idSchema).min(1).max(500).safeParse(ids);
  if (!s.success || !list.success) return { ok: false, error: "invalid" };
  for (const id of list.data) await updateLead(id, { status: s.data }, user.id);
  refresh();
  return { ok: true };
}

export async function bulkDelete(ids: string[]): Promise<Ok<number>> {
  const user = await authorize("editor");
  if (!user) return { ok: false, error: "forbidden" };
  const list = z.array(idSchema).min(1).max(500).safeParse(ids);
  if (!list.success) return { ok: false, error: "invalid" };
  const n = await deleteLeads(list.data, user.id);
  refresh();
  return { ok: true, data: n };
}

/** Development helper to demo realtime notifications without the backend. */
export async function simulateLead(): Promise<Ok> {
  if (process.env.NODE_ENV === "production") return { ok: false, error: "forbidden" };
  if (!(await authorize("editor"))) return { ok: false, error: "forbidden" };
  const names = [
    "Nora Al-Shamsi",
    "Hassan Tawfik",
    "Aisha Al-Rashid",
    "Mohamed Samir",
    "Fatma Al-Kindi",
  ];
  await createLead(
    {
      name: names[Math.floor(Math.random() * names.length)],
      email: `demo${Date.now()}@example.com`,
      phone: "+966500000000",
      company: "Demo Co.",
      service: LEAD_SERVICES[Math.floor(Math.random() * LEAD_SERVICES.length)],
      budget: LEAD_BUDGETS[Math.floor(Math.random() * LEAD_BUDGETS.length)],
      message: "Simulated lead created from the dashboard command palette.",
    },
    { locale: "en", sourcePage: "/contact" },
  );
  refresh();
  return { ok: true };
}
