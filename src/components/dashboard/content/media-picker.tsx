"use client";

import { Check, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { listMedia } from "@/app/[locale]/dashboard/content/actions";
import { cn } from "@/lib/utils";
import { DashButton } from "../ui/dash-button";
import { Dialog, DialogContent } from "../ui/overlays";
import { ACCEPT, MAX_UPLOAD, uploadImage, type UploadedMedia } from "./upload";

/** Pick (or upload) one or many images from the media library. */
export function MediaPicker({
  open,
  onOpenChange,
  multiple,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  multiple?: boolean;
  onPick: (urls: string[]) => void;
}) {
  const t = useTranslations("dash.media");
  const tc = useTranslations("dash.common");
  const [items, setItems] = useState<UploadedMedia[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    listMedia().then((m) => alive && setItems(m));
    return () => {
      alive = false;
    };
  }, [open]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      if (f.size > MAX_UPLOAD) {
        toast.error(t("tooLarge", { name: f.name }));
        continue;
      }
      try {
        const m = await uploadImage(f);
        setItems((prev) => [m, ...(prev ?? [])]);
        setSelected((s) => (multiple ? [...s, m.url] : [m.url]));
      } catch {
        toast.error(t("failed", { name: f.name }));
      }
    }
    setBusy(false);
  };

  const toggle = (url: string) =>
    setSelected((s) =>
      multiple ? (s.includes(url) ? s.filter((x) => x !== url) : [...s, url]) : [url],
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSelected([]);
      }}
    >
      <DialogContent
        title={multiple ? t("chooseMany") : t("choose")}
        className="w-[min(94vw,52rem)]"
      >
        <div className="mt-5 flex items-center justify-between gap-3">
          <input
            ref={input}
            type="file"
            aria-label="Upload images"
            tabIndex={-1}
            accept={ACCEPT}
            multiple={multiple}
            className="sr-only"
            onChange={(e) => upload(e.target.files)}
          />
          <DashButton onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Upload />}
            {busy ? t("uploading") : t("upload")}
          </DashButton>
          <p className="text-xs text-fg-muted">{t("dropHint")}</p>
        </div>
        <div className="mt-4 max-h-[55vh] overflow-y-auto">
          {items === null ? (
            <div className="grid h-40 place-items-center">
              <Loader2 className="size-5 animate-spin text-fg-muted" />
            </div>
          ) : items.length === 0 ? (
            <div className="grid h-40 place-items-center text-sm text-fg-muted">
              <span className="flex flex-col items-center gap-2">
                <ImagePlus className="size-6" />
                {t("empty")}
              </span>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {items.map((m) => {
                const on = selected.includes(m.url);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m.url)}
                      aria-pressed={on}
                      className={cn(
                        "relative block aspect-square w-full overflow-hidden border-2 transition-colors",
                        on ? "border-primary" : "border-transparent hover:border-border-strong",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.url}
                        alt={m.alt_en || m.filename}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                      {on && (
                        <span className="absolute end-1 top-1 grid size-5 place-items-center bg-primary text-white">
                          <Check className="size-3.5" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <DashButton onClick={() => onOpenChange(false)}>
            <X />
            {tc("cancel")}
          </DashButton>
          <DashButton
            variant="primary"
            disabled={!selected.length}
            onClick={() => {
              onPick(selected);
              setSelected([]);
              onOpenChange(false);
            }}
          >
            {t("pick")}
          </DashButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
