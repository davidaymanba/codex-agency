/**
 * One-off: convert every JPEG/PNG/AVIF in the Storage bucket `media` to WebP and point all
 * references (media rows, content columns, rich-text JSON, galleries) at the new files.
 *
 *   npx tsx --env-file=<env> scripts/convert-media-webp.ts            # dry run (read-only)
 *   npx tsx --env-file=<env> scripts/convert-media-webp.ts --apply    # convert + update rows
 *   npx tsx --env-file=<env> scripts/convert-media-webp.ts --delete-old <mapping.json>
 *
 * <env> must define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role:
 * keep it in a git-ignored .env.* file, never in the repo). Old files are kept by --apply;
 * every run writes scripts/out/webp-mapping-<project>-<timestamp>.json (old → new paths)
 * so the change can be verified, rolled back, or cleaned up with --delete-old.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "media";
const MAX_SIDE = 2400; // same as the dashboard uploader (src/components/dashboard/content/upload.ts)
const QUALITY = 85;
const CONVERT = /\.(jpe?g|png|avif)$/i; // GIF stays (animation), WebP is done, SVG is never allowed
/** Tables whose rows may hold media URLs (plain columns, arrays or rich-text JSON). */
const TABLES = ["team_members", "testimonials", "projects", "posts", "services", "solutions", "project_categories", "stats", "tech_logos", "site_settings", "profiles"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use --env-file).");
const sb = createClient(url, key, { auth: { persistSession: false } });
const project = new URL(url).hostname.split(".")[0];
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const kb = (n: number) => `${Math.round(n / 1024)} KB`;

type Mapping = { old: string; new: string; oldSize: number; newSize: number };

async function listAll(prefix = ""): Promise<{ path: string; size: number }[]> {
  const out: { path: string; size: number }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const o of data) {
      const path = prefix ? `${prefix}/${o.name}` : o.name;
      if (o.id === null) out.push(...(await listAll(path))); // folder
      else out.push({ path, size: (o.metadata as { size?: number } | null)?.size ?? 0 });
    }
    if (data.length < 1000) return out;
  }
}

/** Rows (table, id, columns) that mention `/media/<path>` anywhere. */
async function references(paths: string[]) {
  const hits: { table: string; id: unknown; cols: string[]; paths: string[] }[] = [];
  for (const table of TABLES) {
    const { data, error } = await sb.from(table).select("*");
    if (error) throw new Error(`${table}: ${error.message}`);
    for (const row of data ?? []) {
      const cols: string[] = [];
      const found = new Set<string>();
      for (const [col, val] of Object.entries(row)) {
        const s = typeof val === "string" ? val : JSON.stringify(val);
        for (const p of paths) {
          if (!s?.includes(`/${BUCKET}/${p}`)) continue;
          if (!cols.includes(col)) cols.push(col);
          found.add(p);
        }
      }
      if (cols.length) hits.push({ table, id: (row as { id: unknown }).id, cols, paths: [...found] });
    }
  }
  return hits;
}

function replaceIn(val: unknown, map: Map<string, string>): unknown {
  let s = typeof val === "string" ? val : JSON.stringify(val);
  for (const [o, n] of map) s = s.split(`/${BUCKET}/${o}`).join(`/${BUCKET}/${n}`);
  return typeof val === "string" ? s : JSON.parse(s);
}

async function deleteOld(file: string) {
  const mapping = JSON.parse(readFileSync(file, "utf8")) as Mapping[];
  const left = await references(mapping.map((m) => m.old));
  if (left.length) throw new Error(`Old paths are still referenced: ${JSON.stringify(left)}`);
  const { error } = await sb.storage.from(BUCKET).remove(mapping.map((m) => m.old));
  if (error) throw error;
  console.log(`Deleted ${mapping.length} old files from ${project}.`);
}

async function main() {
  const del = args.indexOf("--delete-old");
  if (del >= 0) return deleteOld(args[del + 1]);

  const all = await listAll();
  const todo = all.filter((o) => CONVERT.test(o.path));
  const { data: mediaRows } = await sb.from("media").select("id, path");
  const mediaByPath = new Map((mediaRows ?? []).map((m) => [m.path as string, m.id as string]));
  const refs = await references(todo.map((o) => o.path));

  console.log(`Project ${project}: ${all.length} files in "${BUCKET}", ${todo.length} to convert (${kb(todo.reduce((a, o) => a + o.size, 0))}).`);
  for (const o of todo) {
    const used = refs.filter((r) => r.paths.includes(o.path)).map((r) => `${r.table}.${r.cols.join("+")}`);
    console.log(`  ${o.path}  ${kb(o.size)}  media-row:${mediaByPath.has(o.path) ? "yes" : "no"}  used-in: ${used.join(", ") || "-"}`);
  }
  if (!apply) return console.log("\nDry run — nothing changed. Re-run with --apply to convert.");

  const mapping: Mapping[] = [];
  for (const o of todo) {
    const { data: blob, error } = await sb.storage.from(BUCKET).download(o.path);
    if (error || !blob) throw new Error(`download ${o.path}: ${error?.message}`);
    const input = Buffer.from(await blob.arrayBuffer());
    const output = await sharp(input).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
    const next = o.path.replace(CONVERT, ".webp");
    // Retry: Storage occasionally drops a request with an empty error.
    let failure = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      const up = await sb.storage.from(BUCKET).upload(next, output, { contentType: "image/webp", upsert: false });
      failure = up.error && !/exists|duplicate/i.test(up.error.message ?? "") ? JSON.stringify(up.error, Object.getOwnPropertyNames(up.error)) : "";
      if (!failure) break;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
    if (failure) throw new Error(`upload ${next}: ${failure}`);
    mapping.push({ old: o.path, new: next, oldSize: input.length, newSize: output.length });
    console.log(`  ✓ ${o.path} ${kb(input.length)} → ${next} ${kb(output.length)}`);
  }

  // Save the mapping before touching rows, so a failure part-way can always be traced back.
  mkdirSync("scripts/out", { recursive: true });
  const file = `scripts/out/webp-mapping-${project}-${Date.now()}.json`;
  writeFileSync(file, JSON.stringify(mapping, null, 2));

  const map = new Map(mapping.map((m) => [m.old, m.new]));
  for (const m of mapping) {
    const id = mediaByPath.get(m.old);
    if (!id) continue;
    const { error } = await sb
      .from("media")
      .update({ path: m.new, url: `${url}/storage/v1/object/public/${BUCKET}/${m.new}`, mime: "image/webp", size: m.newSize })
      .eq("id", id);
    if (error) throw new Error(`media ${id}: ${error.message}`);
  }
  for (const r of refs) {
    const { data: row } = await sb.from(r.table).select(r.cols.join(",")).eq("id", r.id).single();
    const patch = Object.fromEntries(r.cols.map((c) => [c, replaceIn((row as unknown as Record<string, unknown>)[c], map)]));
    const { error } = await sb.from(r.table).update(patch).eq("id", r.id);
    if (error) throw new Error(`${r.table} ${r.id}: ${error.message}`);
    console.log(`  ↻ ${r.table} ${r.id} (${r.cols.join(", ")})`);
  }

  const before = mapping.reduce((a, m) => a + m.oldSize, 0);
  const after = mapping.reduce((a, m) => a + m.newSize, 0);
  console.log(`\nDone: ${mapping.length} files, ${kb(before)} → ${kb(after)}. Old files kept.`);
  console.log(`Mapping: ${file}\nAfter checking the site: --delete-old ${file}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
