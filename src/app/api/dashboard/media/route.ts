import type { MediaRow } from "@/content/types";
import { authorize } from "@/lib/auth/session";
import { db, uid } from "@/lib/dashboard/mock-db";
import { logActivity } from "@/lib/dashboard/repo";
import { rateLimit, sameOrigin } from "@/lib/rate-limit";

/**
 * Upload images (editor+). TEMPORARY storage: bytes kept in memory and served by
 * /api/media/[id]. Backend phase: Supabase Storage bucket `media` with the same checks.
 * SVG is rejected on purpose (can carry scripts).
 */
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/gif": (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  "image/webp": (b) =>
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  "image/avif": (b) => ["ftypavif", "ftypavis"].includes(String.fromCharCode(...b.slice(4, 12))),
};

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "forbidden" }, { status: 403 });
  const user = await authorize("editor");
  if (!user) return Response.json({ error: "forbidden" }, { status: 403 });
  if (!rateLimit(`upload:${user.id}`, 60, 10 * 60_000).ok)
    return Response.json({ error: "rate_limited" }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "invalid" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  const check = TYPES[file.type];
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!check || !check(bytes)) return Response.json({ error: "type" }, { status: 415 });

  const id = uid("media");
  const row: MediaRow = {
    id,
    filename: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "image",
    mime: file.type,
    size: file.size,
    url: `/api/media/${id}`,
    alt_en: "",
    alt_ar: "",
    uploaded_by: user.id,
    created_at: new Date().toISOString(),
  };
  db.mediaBlobs.set(id, Buffer.from(bytes));
  db.media.unshift(row);
  await logActivity({
    actor_id: user.id,
    action: "upload",
    entity: "media",
    entity_id: id,
    summary: `${user.full_name} uploaded ${row.filename}`,
    meta: { actor: user.full_name, name: row.filename },
  });
  return Response.json(row);
}
