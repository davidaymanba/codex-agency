"use client";

import { createUpload, registerMedia } from "@/app/[locale]/dashboard/content/actions";

export type UploadedMedia = { id: string; url: string; filename: string; size: number; mime: string; alt_en: string; alt_ar: string; created_at: string };

/** Largest file a visitor may pick; it is re-encoded to WebP before the 8 MB storage limit applies. */
export const MAX_UPLOAD = 25 * 1024 * 1024;
export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/** Longest side of a stored image — more than any layout on the site displays. */
const MAX_SIDE = 2400;
const WEBP_QUALITY = 0.85;

/**
 * Re-encode an image as WebP in the browser (Canvas), scaled down to MAX_SIDE.
 * Done client-side so the server needs no native image library (Hostinger's old glibc).
 * GIFs are kept as-is (Canvas would drop the animation); if the browser can't encode
 * WebP, or the result isn't smaller, the original file is uploaded unchanged.
 */
export async function toWebp(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", WEBP_QUALITY));
  if (!blob || blob.type !== "image/webp") return file;
  if (blob.size >= file.size && file.type === "image/webp" && scale === 1) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}

/**
 * Upload one image to Supabase Storage with progress:
 * 0) the browser converts it to WebP (see `toWebp`),
 * 1) server action checks role/type/size and returns a short-lived signed upload URL,
 * 2) the browser PUTs the file there (XHR for progress events),
 * 3) server action verifies the object exists and registers it in the media library.
 * The bucket itself also enforces the 8 MB / image-type limits.
 */
export async function uploadImage(source: File, onProgress?: (pct: number) => void): Promise<UploadedMedia> {
  const file = await toWebp(source);
  const slot = await createUpload(file.type, file.size);
  if (!slot.ok) throw new Error(slot.error);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", slot.signedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });

  const reg = await registerMedia(slot.path, file.name);
  if (!reg.ok) throw new Error(reg.error);
  return reg.media as UploadedMedia;
}
