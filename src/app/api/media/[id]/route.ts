import { db } from "@/lib/dashboard/mock-db";

/** Public read of an uploaded image (TEMPORARY until Supabase Storage). */
export async function GET(_req: Request, { params }: RouteContext<"/api/media/[id]">) {
  const { id } = await params;
  const row = db.media.find((m) => m.id === id);
  const blob = db.mediaBlobs.get(id);
  if (!row || !blob) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(blob), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(blob.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
