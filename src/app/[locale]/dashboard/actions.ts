"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize } from "@/lib/auth/session";
import { addLeadNote, createLead, deleteLeads, getLead, leadsSince, listUsers, reorderColumn, updateLead } from "@/lib/dashboard/repo";
import { LEAD_STATUSES } from "@/lib/dashboard/types";
import { LEAD_BUDGETS, LEAD_SERVICES } from "@/lib/schemas/lead";
import { dbError } from "@/lib/supabase/admin";

/**
 * Dashboard lead mutations. Each action checks the role first (fast, friendly errors);
 * RLS in Postgres enforces the same rules again on every query.
 */

type Ok<T = undefined> = { ok: true; data?: T } | { ok: false; error: "forbidden" | "invalid" | "not_found" };
const refresh = () => revalidatePath("/[locale]/dashboard", "layout");
const fail = (e: Parameters<typeof dbError>[0]): Ok => {
  const code = dbError(e);
  return { ok: false, error: code === "forbidden" ? "forbidden" : code === "not_found" ? "not_found" : "invalid" };
};

const statusSchema = z.enum(LEAD_STATUSES);
const idSchema = z.uuid();

export async function pollLeads(sinceIso: string) {
  if (!(await authorize("viewer"))) return [];
  const since = z.iso.datetime({ offset: true }).safeParse(sinceIso);
  if (!since.success) return [];
  return leadsSince(since.data);
}

export async function getLeadDetail(id: string) {
  if (!(await authorize("viewer"))) return null;
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return null;
  const [detail, users] = await Promise.all([getLead(parsed.data), listUsers()]);
  return detail ? { ...detail, users } : null;
}

export async function moveLead(id: string, status: string, orderedIds: string[]): Promise<Ok> {
  if (!(await authorize("editor"))) return { ok: false, error: "forbidden" };
  const s = statusSchema.safeParse(status);
  const ids = z.array(idSchema).max(500).safeParse(orderedIds);
  if (!s.success || !ids.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const err = await reorderColumn(s.data, ids.data.includes(id) ? ids.data : [...ids.data, id]);
  if (err) return fail(err);
  refresh();
  return { ok: true };
}

const patchSchema = z
  .object({
    status: statusSchema.optional(),
    assigned_to: z.uuid().nullable().optional(),
    estimated_value: z.number().int().min(0).max(100_000_000).nullable().optional(),
  })
  .strict();

export async function updateLeadFields(id: string, patch: unknown): Promise<Ok> {
  if (!(await authorize("editor"))) return { ok: false, error: "forbidden" };
  const p = patchSchema.safeParse(patch);
  if (!p.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const { data, error } = await updateLead(id, p.data);
  if (error) return fail(error);
  if (!data) return { ok: false, error: "not_found" };
  refresh();
  return { ok: true };
}

export async function addNote(id: string, body: string): Promise<Ok> {
  const user = await authorize("editor");
  if (!user) return { ok: false, error: "forbidden" };
  const b = z.string().trim().min(1).max(2000).safeParse(body);
  if (!b.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const { error } = await addLeadNote(id, b.data, user.id);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function bulkUpdateStatus(ids: string[], status: string): Promise<Ok> {
  if (!(await authorize("editor"))) return { ok: false, error: "forbidden" };
  const s = statusSchema.safeParse(status);
  const list = z.array(idSchema).min(1).max(500).safeParse(ids);
  if (!s.success || !list.success) return { ok: false, error: "invalid" };
  for (const id of list.data) {
    const { error } = await updateLead(id, { status: s.data });
    if (error) return fail(error);
  }
  refresh();
  return { ok: true };
}

export async function bulkDelete(ids: string[]): Promise<Ok<number>> {
  if (!(await authorize("editor"))) return { ok: false, error: "forbidden" };
  const list = z.array(idSchema).min(1).max(500).safeParse(ids);
  if (!list.success) return { ok: false, error: "invalid" };
  const { count, error } = await deleteLeads(list.data);
  if (error) return fail(error) as Ok<number>;
  refresh();
  return { ok: true, data: count };
}

/** Development helper to demo realtime notifications. */
export async function simulateLead(): Promise<Ok> {
  if (process.env.NODE_ENV === "production") return { ok: false, error: "forbidden" };
  if (!(await authorize("editor"))) return { ok: false, error: "forbidden" };
  const names = ["Nora Al-Shamsi", "Hassan Tawfik", "Aisha Al-Rashid", "Mohamed Samir", "Fatma Al-Kindi"];
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
