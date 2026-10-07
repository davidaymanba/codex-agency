"use client";

export type UploadedMedia = {
  id: string;
  url: string;
  filename: string;
  size: number;
  mime: string;
  alt_en: string;
  alt_ar: string;
  created_at: string;
};

export const MAX_UPLOAD = 8 * 1024 * 1024;
export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/** Upload one image with progress (XHR, since fetch has no upload progress). */
export function uploadImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadedMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/dashboard/media");
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(JSON.parse(xhr.responseText || "{}").error ?? "failed"));
    };
    xhr.onerror = () => reject(new Error("network"));
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}
