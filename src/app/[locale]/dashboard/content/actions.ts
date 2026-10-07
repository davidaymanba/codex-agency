"use server";

import { z } from "zod";
import type { PostRow, ProjectRow } from "@/content/types";
import { authorize } from "@/lib/auth/session";
import { COLLECTION_KEYS, getDef, toRow, type CollectionKey } from "@/lib/dashboard/collections";
import { db, uid } from "@/lib/dashboard/mock-db";
import { logActivity } from "@/lib/dashboard/repo";
import { revalidatePublic } from "@/lib/dashboard/revalidate";
import { postSchema, projectSchema } from "@/lib/schemas/content";
import { docText } from "@/lib/rich";

/**
 * Content mutations (editor+). Every action: role check → zod validation → write →
 * activity log → on-demand revalidation of the public site.
 */

export type Result<T = undefined> =
  | { ok: true; data?: T }
  | {
      ok: false;
      error: "forbidden" | "invalid" | "not_found" | "duplicate";
      issues?: { path: string; message: string }[];
    };

const keySchema = z.enum(COLLECTION_KEYS as [CollectionKey, ...CollectionKey[]]);
const idSchema = z.string().min(1).max(80);
const issues = (e: z.ZodError) =>
  e.issues.map((i) => ({ path: i.path.join("."), message: i.message }));

async function editor() {
  return authorize("editor");
}

/* ---------------------------------------------------------------- simple collections */

export async function saveCollectionItem(
  key: string,
  id: string | null,
  values: unknown,
): Promise<Result<string>> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const k = keySchema.safeParse(key);
  if (!k.success) return { ok: false, error: "invalid" };
  const def = getDef(k.data);
  const parsed = def.schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid", issues: issues(parsed.error) };
  const fields = toRow(k.data, parsed.data as Record<string, unknown>);
  const rows = def.rows();

  if (def.unique) {
    const clash = rows.find((r) => r[def.unique!] === fields[def.unique!] && r.id !== id);
    if (clash)
      return {
        ok: false,
        error: "duplicate",
        issues: [{ path: def.unique, message: "duplicate" }],
      };
  }

  let row = id ? rows.find((r) => r.id === id) : undefined;
  if (id && !row) return { ok: false, error: "not_found" };
  if (row) Object.assign(row, fields);
  else {
    row = {
      ...fields,
      id: uid(k.data),
      sort_order: Math.max(0, ...rows.map((r) => r.sort_order)) + 1,
    } as (typeof rows)[number];
    rows.push(row);
  }
  await logActivity({
    actor_id: user.id,
    action: id ? "content_update" : "content_create",
    entity: "content",
    entity_id: row.id,
    summary: `${user.full_name} ${id ? "updated" : "created"} ${def.title(row)} (${k.data})`,
    meta: { actor: user.full_name, name: def.title(row), section: k.data },
  });
  revalidatePublic();
  return { ok: true, data: row.id };
}

export async function deleteCollectionItem(key: string, id: string): Promise<Result> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const k = keySchema.safeParse(key);
  if (!k.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const def = getDef(k.data);
  const rows = def.rows();
  const i = rows.findIndex((r) => r.id === id);
  if (i === -1) return { ok: false, error: "not_found" };
  const [gone] = rows.splice(i, 1);
  await logActivity({
    actor_id: user.id,
    action: "content_delete",
    entity: "content",
    entity_id: id,
    summary: `${user.full_name} deleted ${def.title(gone)} (${k.data})`,
    meta: { actor: user.full_name, name: def.title(gone), section: k.data },
  });
  revalidatePublic();
  return { ok: true };
}

export async function reorderCollection(key: string, ids: string[]): Promise<Result> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const k = keySchema.safeParse(key);
  const list = z.array(idSchema).max(500).safeParse(ids);
  if (!k.success || !list.success) return { ok: false, error: "invalid" };
  const rows = getDef(k.data).rows();
  list.data.forEach((id, i) => {
    const r = rows.find((x) => x.id === id);
    if (r) r.sort_order = i + 1;
  });
  await logActivity({
    actor_id: user.id,
    action: "reorder",
    entity: "content",
    entity_id: null,
    summary: `${user.full_name} reordered ${k.data}`,
    meta: { actor: user.full_name, section: k.data },
  });
  revalidatePublic();
  return { ok: true };
}

export async function setCollectionPublished(
  key: string,
  id: string,
  published: boolean,
): Promise<Result> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const k = keySchema.safeParse(key);
  if (!k.success || !idSchema.safeParse(id).success || typeof published !== "boolean")
    return { ok: false, error: "invalid" };
  const def = getDef(k.data);
  const row = def.rows().find((r) => r.id === id);
  if (!row) return { ok: false, error: "not_found" };
  row.published = published;
  await logActivity({
    actor_id: user.id,
    action: published ? "publish" : "unpublish",
    entity: "content",
    entity_id: id,
    summary: `${user.full_name} ${published ? "published" : "unpublished"} ${def.title(row)}`,
    meta: { actor: user.full_name, name: def.title(row) },
  });
  revalidatePublic();
  return { ok: true };
}

/* ---------------------------------------------------------------- projects */

const flatLoc = (v: Record<string, unknown>, keys: string[]) => {
  const out: Record<string, unknown> = { ...v };
  for (const k of keys) {
    const pair = v[k] as { en: string; ar: string };
    out[`${k}_en`] = pair.en;
    out[`${k}_ar`] = pair.ar;
    delete out[k];
  }
  return out;
};

export async function saveProject(id: string | null, values: unknown): Promise<Result<string>> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid", issues: issues(parsed.error) };
  const v = parsed.data;
  if (db.projects.some((p) => p.slug === v.slug && p.id !== id))
    return { ok: false, error: "duplicate", issues: [{ path: "slug", message: "duplicate" }] };
  const fields = flatLoc(v as unknown as Record<string, unknown>, [
    "title",
    "summary",
    "challenge",
    "approach",
    "seo_title",
    "seo_description",
  ]) as Partial<ProjectRow>;

  let row = id ? db.projects.find((p) => p.id === id) : undefined;
  if (id && !row) return { ok: false, error: "not_found" };
  if (row) Object.assign(row, fields);
  else {
    row = {
      ...(fields as ProjectRow),
      id: uid("prj"),
      sort_order: Math.max(0, ...db.projects.map((p) => p.sort_order)) + 1,
    };
    db.projects.push(row);
  }
  await logActivity({
    actor_id: user.id,
    action: id ? "content_update" : "content_create",
    entity: "project",
    entity_id: row.id,
    summary: `${user.full_name} saved project ${row.title_en}`,
    meta: { actor: user.full_name, name: row.title_en, section: "projects" },
  });
  revalidatePublic();
  return { ok: true, data: row.id };
}

export async function deleteProject(id: string): Promise<Result> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const i = db.projects.findIndex((p) => p.id === id);
  if (i === -1) return { ok: false, error: "not_found" };
  const [gone] = db.projects.splice(i, 1);
  await logActivity({
    actor_id: user.id,
    action: "content_delete",
    entity: "project",
    entity_id: id,
    summary: `${user.full_name} deleted project ${gone.title_en}`,
    meta: { actor: user.full_name, name: gone.title_en, section: "projects" },
  });
  revalidatePublic();
  return { ok: true };
}

export async function patchProject(id: string, patch: unknown): Promise<Result> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const p = z
    .object({ featured: z.boolean().optional(), status: z.enum(["draft", "published"]).optional() })
    .strict()
    .safeParse(patch);
  if (!p.success) return { ok: false, error: "invalid" };
  const row = db.projects.find((x) => x.id === id);
  if (!row) return { ok: false, error: "not_found" };
  Object.assign(row, p.data);
  if (p.data.status)
    await logActivity({
      actor_id: user.id,
      action: p.data.status === "published" ? "publish" : "unpublish",
      entity: "project",
      entity_id: id,
      summary: `${user.full_name} set ${row.title_en} to ${p.data.status}`,
      meta: { actor: user.full_name, name: row.title_en },
    });
  revalidatePublic();
  return { ok: true };
}

export async function reorderProjects(ids: string[]): Promise<Result> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const list = z.array(idSchema).max(500).safeParse(ids);
  if (!list.success) return { ok: false, error: "invalid" };
  list.data.forEach((id, i) => {
    const r = db.projects.find((x) => x.id === id);
    if (r) r.sort_order = i + 1;
  });
  await logActivity({
    actor_id: user.id,
    action: "reorder",
    entity: "project",
    entity_id: null,
    summary: `${user.full_name} reordered projects`,
    meta: { actor: user.full_name, section: "projects" },
  });
  revalidatePublic();
  return { ok: true };
}

/* ---------------------------------------------------------------- posts */

export async function savePost(id: string | null, values: unknown): Promise<Result<string>> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const parsed = postSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid", issues: issues(parsed.error) };
  const v = parsed.data;
  if (db.posts.some((p) => p.slug === v.slug && p.id !== id))
    return { ok: false, error: "duplicate", issues: [{ path: "slug", message: "duplicate" }] };
  // A future date on a "published" post becomes "scheduled"; a past date on "scheduled" goes live.
  const future = new Date(v.published_at) > new Date();
  const status = v.status === "draft" ? "draft" : future ? "scheduled" : "published";
  const words = docText(v.content_en as PostRow["content_en"])
    .split(/\s+/)
    .filter(Boolean).length;
  const fields = {
    ...flatLoc(v as unknown as Record<string, unknown>, [
      "title",
      "excerpt",
      "seo_title",
      "seo_description",
    ]),
    status,
    reading_minutes: Math.max(1, Math.round(words / 220)),
  } as Partial<PostRow>;

  let row = id ? db.posts.find((p) => p.id === id) : undefined;
  if (id && !row) return { ok: false, error: "not_found" };
  if (row) Object.assign(row, fields);
  else {
    row = { ...(fields as PostRow), id: uid("post") };
    db.posts.push(row);
  }
  await logActivity({
    actor_id: user.id,
    action: id ? "content_update" : "content_create",
    entity: "post",
    entity_id: row.id,
    summary: `${user.full_name} saved post ${row.title_en}`,
    meta: { actor: user.full_name, name: row.title_en, section: "posts" },
  });
  revalidatePublic();
  return { ok: true, data: row.id };
}

export async function deletePost(id: string): Promise<Result> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const i = db.posts.findIndex((p) => p.id === id);
  if (i === -1) return { ok: false, error: "not_found" };
  const [gone] = db.posts.splice(i, 1);
  await logActivity({
    actor_id: user.id,
    action: "content_delete",
    entity: "post",
    entity_id: id,
    summary: `${user.full_name} deleted post ${gone.title_en}`,
    meta: { actor: user.full_name, name: gone.title_en, section: "posts" },
  });
  revalidatePublic();
  return { ok: true };
}

/* ---------------------------------------------------------------- media */

/** Where a media URL is referenced (shown before deleting). */
export async function mediaUsage(url: string): Promise<string[]> {
  if (!(await authorize("viewer"))) return [];
  const used: string[] = [];
  db.projects.forEach(
    (p) =>
      (p.cover_image === url || p.gallery?.includes(url)) && used.push(`Project: ${p.title_en}`),
  );
  db.posts.forEach((p) => p.cover_image === url && used.push(`Post: ${p.title_en}`));
  db.team.forEach((m) => m.photo_url === url && used.push(`Team: ${m.name_en}`));
  db.testimonials.forEach(
    (tm) => tm.avatar_url === url && used.push(`Testimonial: ${tm.author_name}`),
  );
  return used;
}

export async function deleteMedia(id: string): Promise<Result> {
  const user = await editor();
  if (!user) return { ok: false, error: "forbidden" };
  const i = db.media.findIndex((m) => m.id === id);
  if (i === -1) return { ok: false, error: "not_found" };
  const [gone] = db.media.splice(i, 1);
  db.mediaBlobs.delete(id);
  await logActivity({
    actor_id: user.id,
    action: "content_delete",
    entity: "media",
    entity_id: id,
    summary: `${user.full_name} deleted ${gone.filename}`,
    meta: { actor: user.full_name, name: gone.filename, section: "media" },
  });
  return { ok: true };
}

export async function updateMediaAlt(id: string, alt: unknown): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  const a = z
    .object({ en: z.string().trim().max(200), ar: z.string().trim().max(200) })
    .safeParse(alt);
  const m = db.media.find((x) => x.id === id);
  if (!a.success || !m) return { ok: false, error: "invalid" };
  m.alt_en = a.data.en;
  m.alt_ar = a.data.ar;
  return { ok: true };
}

export async function listMedia() {
  if (!(await authorize("viewer"))) return [];
  return db.media.map((m) => ({
    id: m.id,
    url: m.url,
    filename: m.filename,
    size: m.size,
    mime: m.mime,
    alt_en: m.alt_en,
    alt_ar: m.alt_ar,
    created_at: m.created_at,
  }));
}
