"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PostRow } from "@/content/types";
import { authorize } from "@/lib/auth/session";
import { COLLECTION_KEYS, getDef, toRow, type CollectionKey } from "@/lib/dashboard/collections";
import { revalidatePublic } from "@/lib/dashboard/revalidate";
import { docText } from "@/lib/rich";
import { postSchema, projectSchema } from "@/lib/schemas/content";
import { dbError } from "@/lib/supabase/admin";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Content mutations (editor+): role check → zod validation → write AS THE USER (RLS) →
 * on-demand revalidation of the public site. The activity log is written by DB triggers.
 */

export type Result<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: "forbidden" | "invalid" | "not_found" | "duplicate"; issues?: { path: string; message: string }[] };

const keySchema = z.enum(COLLECTION_KEYS as [CollectionKey, ...CollectionKey[]]);
const idSchema = z.uuid();
const issues = (e: z.ZodError) => e.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
const fail = <T,>(e: Parameters<typeof dbError>[0], uniqueField?: string): Result<T> => {
  const code = dbError(e);
  if (code === "duplicate") return { ok: false, error: "duplicate", issues: uniqueField ? [{ path: uniqueField, message: "duplicate" }] : undefined };
  return { ok: false, error: code === "forbidden" || code === "self" || code === "last_admin" ? "forbidden" : code === "not_found" ? "not_found" : "invalid" };
};
const editor = () => authorize("editor");
const db = () => supabaseServer();

/* ---------------------------------------------------------------- simple collections */

export async function saveCollectionItem(key: string, id: string | null, values: unknown): Promise<Result<string>> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  const k = keySchema.safeParse(key);
  if (!k.success || (id !== null && !idSchema.safeParse(id).success)) return { ok: false, error: "invalid" };
  const def = getDef(k.data);
  const parsed = def.schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid", issues: issues(parsed.error) };
  const fields = toRow(k.data, parsed.data as Record<string, unknown>);
  const client = await db();
  const table = client.from(def.table as never);

  if (id) {
    const { data, error } = await table.update(fields as never).eq("id" as never, id).select("id").maybeSingle();
    if (error) return fail(error, def.unique);
    if (!data) return { ok: false, error: "not_found" };
  } else {
    const { data: last } = await client.from(def.table as never).select("sort_order").order("sort_order" as never, { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await client
      .from(def.table as never)
      .insert({ ...fields, sort_order: ((last as { sort_order?: number } | null)?.sort_order ?? 0) + 1 } as never)
      .select("id")
      .single();
    if (error) return fail(error, def.unique);
    id = (data as { id: string }).id;
  }
  revalidatePublic();
  return { ok: true, data: id };
}

export async function deleteCollectionItem(key: string, id: string): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  const k = keySchema.safeParse(key);
  if (!k.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const { error, count } = await (await db()).from(getDef(k.data).table as never).delete({ count: "exact" }).eq("id" as never, id);
  if (error) return fail(error);
  if (!count) return { ok: false, error: "not_found" };
  revalidatePublic();
  return { ok: true };
}

export async function reorderCollection(key: string, ids: string[]): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  const k = keySchema.safeParse(key);
  const list = z.array(idSchema).max(500).safeParse(ids);
  if (!k.success || !list.success) return { ok: false, error: "invalid" };
  const client = await db();
  const results = await Promise.all(list.data.map((id, i) => client.from(getDef(k.data).table as never).update({ sort_order: i + 1 } as never).eq("id" as never, id)));
  const err = results.find((r) => r.error)?.error;
  if (err) return fail(err);
  revalidatePublic();
  return { ok: true };
}

export async function setCollectionPublished(key: string, id: string, published: boolean): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  const k = keySchema.safeParse(key);
  if (!k.success || !idSchema.safeParse(id).success || typeof published !== "boolean") return { ok: false, error: "invalid" };
  const { error, count } = await (await db()).from(getDef(k.data).table as never).update({ published } as never, { count: "exact" }).eq("id" as never, id);
  if (error) return fail(error);
  if (!count) return { ok: false, error: "not_found" };
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
  if (!(await editor())) return { ok: false, error: "forbidden" };
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid", issues: issues(parsed.error) };
  const fields = flatLoc(parsed.data as unknown as Record<string, unknown>, ["title", "summary", "challenge", "approach", "seo_title", "seo_description"]);
  const client = await db();
  if (id) {
    const { data, error } = await client.from("projects").update(fields as never).eq("id", id).select("id").maybeSingle();
    if (error) return fail(error, "slug");
    if (!data) return { ok: false, error: "not_found" };
  } else {
    const { data: last } = await client.from("projects").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await client
      .from("projects")
      .insert({ ...fields, sort_order: (last?.sort_order ?? 0) + 1 } as never)
      .select("id")
      .single();
    if (error) return fail(error, "slug");
    id = data.id;
  }
  revalidatePublic();
  return { ok: true, data: id };
}

export async function deleteProject(id: string): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  if (!idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const { error, count } = await (await db()).from("projects").delete({ count: "exact" }).eq("id", id);
  if (error) return fail(error);
  if (!count) return { ok: false, error: "not_found" };
  revalidatePublic();
  return { ok: true };
}

export async function patchProject(id: string, patch: unknown): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  const p = z.object({ featured: z.boolean().optional(), status: z.enum(["draft", "published"]).optional() }).strict().safeParse(patch);
  if (!p.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const { error, count } = await (await db()).from("projects").update(p.data, { count: "exact" }).eq("id", id);
  if (error) return fail(error);
  if (!count) return { ok: false, error: "not_found" };
  revalidatePublic();
  return { ok: true };
}

export async function reorderProjects(ids: string[]): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  const list = z.array(idSchema).max(500).safeParse(ids);
  if (!list.success) return { ok: false, error: "invalid" };
  const client = await db();
  const results = await Promise.all(list.data.map((id, i) => client.from("projects").update({ sort_order: i + 1 }).eq("id", id)));
  const err = results.find((r) => r.error)?.error;
  if (err) return fail(err);
  revalidatePublic();
  return { ok: true };
}

/* ---------------------------------------------------------------- posts */

export async function savePost(id: string | null, values: unknown): Promise<Result<string>> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const parsed = postSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "invalid", issues: issues(parsed.error) };
  const v = parsed.data;
  // A future date on a non-draft post means "scheduled"; it goes live automatically (RLS checks the date).
  const future = new Date(v.published_at) > new Date();
  const status = v.status === "draft" ? "draft" : future ? "scheduled" : "published";
  const words = docText(v.content_en as PostRow["content_en"]).split(/\s+/).filter(Boolean).length;
  const fields = {
    ...flatLoc(v as unknown as Record<string, unknown>, ["title", "excerpt", "seo_title", "seo_description"]),
    status,
    reading_minutes: Math.max(1, Math.round(words / 220)),
  };
  const client = await db();
  if (id) {
    const { data, error } = await client.from("posts").update(fields as never).eq("id", id).select("id").maybeSingle();
    if (error) return fail(error, "slug");
    if (!data) return { ok: false, error: "not_found" };
  } else {
    const { data, error } = await client.from("posts").insert(fields as never).select("id").single();
    if (error) return fail(error, "slug");
    id = data.id;
  }
  revalidatePublic();
  return { ok: true, data: id };
}

export async function deletePost(id: string): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  if (!idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const { error, count } = await (await db()).from("posts").delete({ count: "exact" }).eq("id", id);
  if (error) return fail(error);
  if (!count) return { ok: false, error: "not_found" };
  revalidatePublic();
  return { ok: true };
}

/* ---------------------------------------------------------------- media (Supabase Storage) */

const BUCKET = "media";
const MAX_BYTES = 8 * 1024 * 1024;
const MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };
const publicUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

/** Step 1 of an upload: a short-lived signed URL the browser PUTs the file to (with progress). */
export async function createUpload(mime: string, size: number) {
  if (!(await editor())) return { ok: false as const, error: "forbidden" as const };
  const ext = MIME_EXT[mime];
  if (!ext || !Number.isInteger(size) || size <= 0 || size > MAX_BYTES) return { ok: false as const, error: "invalid" as const };
  const d = new Date();
  const path = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;
  const { data, error } = await (await db()).storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false as const, error: "forbidden" as const };
  return { ok: true as const, path, signedUrl: data.signedUrl };
}

/** Step 2: register the uploaded object (verified to exist) in the media library. */
export async function registerMedia(path: string, filename: string) {
  const user = await editor();
  if (!user) return { ok: false as const, error: "forbidden" as const };
  if (!/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|avif|gif)$/.test(path)) return { ok: false as const, error: "invalid" as const };
  const client = await db();
  const [dir, file] = [path.slice(0, path.lastIndexOf("/")), path.slice(path.lastIndexOf("/") + 1)];
  const { data: listing } = await client.storage.from(BUCKET).list(dir, { search: file, limit: 1 });
  const obj = listing?.find((o) => o.name === file);
  if (!obj) return { ok: false as const, error: "not_found" as const };
  const meta = obj.metadata as { mimetype?: string; size?: number } | null;
  const { data, error } = await client
    .from("media")
    .insert({
      bucket: BUCKET,
      path,
      url: publicUrl(path),
      filename: filename.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "image",
      mime: meta?.mimetype ?? "image/jpeg",
      size: meta?.size ?? 1,
      uploaded_by: user.id,
    })
    .select()
    .single();
  if (error) return { ok: false as const, error: "invalid" as const };
  return { ok: true as const, media: data };
}

export async function listMedia() {
  if (!(await authorize("viewer"))) return [];
  const { data } = await (await db()).from("media").select("id, url, filename, size, mime, alt_en, alt_ar, created_at").order("created_at", { ascending: false });
  return data ?? [];
}

/** Where a media URL is referenced (shown before deleting). */
export async function mediaUsage(url: string): Promise<string[]> {
  if (!(await authorize("viewer"))) return [];
  const client = await db();
  const [projects, posts, team, testimonials] = await Promise.all([
    client.from("projects").select("title_en, cover_image, gallery"),
    client.from("posts").select("title_en, cover_image"),
    client.from("team_members").select("name_en, photo_url"),
    client.from("testimonials").select("author_name, avatar_url"),
  ]);
  const used: string[] = [];
  (projects.data ?? []).forEach((p) => (p.cover_image === url || p.gallery?.includes(url)) && used.push(`Project: ${p.title_en}`));
  (posts.data ?? []).forEach((p) => p.cover_image === url && used.push(`Post: ${p.title_en}`));
  (team.data ?? []).forEach((m) => m.photo_url === url && used.push(`Team: ${m.name_en}`));
  (testimonials.data ?? []).forEach((tm) => tm.avatar_url === url && used.push(`Testimonial: ${tm.author_name}`));
  return used;
}

export async function deleteMedia(id: string): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  if (!idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const client = await db();
  const { data: row } = await client.from("media").select("bucket, path").eq("id", id).maybeSingle();
  if (!row) return { ok: false, error: "not_found" };
  const { error: se } = await client.storage.from(row.bucket).remove([row.path]);
  if (se) return { ok: false, error: "forbidden" };
  const { error } = await client.from("media").delete().eq("id", id);
  if (error) return fail(error);
  return { ok: true };
}

export async function updateMediaAlt(id: string, alt: unknown): Promise<Result> {
  if (!(await editor())) return { ok: false, error: "forbidden" };
  const a = z.object({ en: z.string().trim().max(200), ar: z.string().trim().max(200) }).safeParse(alt);
  if (!a.success || !idSchema.safeParse(id).success) return { ok: false, error: "invalid" };
  const { error } = await (await db()).from("media").update({ alt_en: a.data.en, alt_ar: a.data.ar }).eq("id", id);
  return error ? fail(error) : { ok: true };
}
