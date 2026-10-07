"use client";

import { createUpload, registerMedia } from "@/app/[locale]/dashboard/content/actions";

export type UploadedMedia = { id: string; url: string; filename: string; size: number; mime: string; alt_en: string; alt_ar: string; created_at: string };

export const MAX_UPLOAD = 8 * 1024 * 1024;
export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/**
 * Upload one image to Supabase Storage with progress:
 * 1) server action checks role/type/size and returns a short-lived signed upload URL,
 * 2) the browser PUTs the file there (XHR for progress events),
 * 3) server action verifies the object exists and registers it in the media library.
 * The bucket itself also enforces the 8 MB / image-type limits.
 */
export async function uploadImage(file: File, onProgress?: (pct: number) => void): Promise<UploadedMedia> {
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
