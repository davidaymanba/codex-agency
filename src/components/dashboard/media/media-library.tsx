"use client";

import { Copy, Search, Trash2, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Dialog as D } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteMedia, mediaUsage, updateMediaAlt } from "@/app/[locale]/dashboard/content/actions";
import { usePrefersReducedMotion } from "@/hooks/use-media";
import { cn } from "@/lib/utils";
import { ACCEPT, MAX_UPLOAD, uploadImage, type UploadedMedia } from "../content/upload";
import { useCan } from "../shell/user-context";
import { DashButton } from "../ui/dash-button";
import { EmptyState } from "../ui/empty-state";
import { ConfirmDialog, SheetContent, SheetTitle } from "../ui/overlays";
import { Card, Input, Label } from "../ui/primitives";

type Job = { key: string; name: string; pct: number; error?: string };
const kb = (n: number) =>
  n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

/** Media library: drag & drop uploads with progress, search, copy URL, alt text, usage-aware delete. */
export function MediaLibrary({ items: initial }: { items: UploadedMedia[] }) {
  const t = useTranslations("dash");
  const format = useFormatter();
  const router = useRouter();
  const canEdit = useCan("editor");
  const reduced = usePrefersReducedMotion();
  const [items, setItems] = useState(initial);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState("");
  const [over, setOver] = useState(false);
  const [open, setOpen] = useState<UploadedMedia | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initial);
  }, [initial]);

  const upload = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      if (file.size > MAX_UPLOAD) {
        toast.error(t("media.tooLarge", { name: file.name }));
        continue;
      }
      if (!ACCEPT.split(",").includes(file.type)) {
        toast.error(t("media.badType", { name: file.name }));
        continue;
      }
      setJobs((j) => [...j, { key, name: file.name, pct: 0 }]);
      try {
        const m = await uploadImage(file, (pct) =>
          setJobs((j) => j.map((x) => (x.key === key ? { ...x, pct } : x))),
        );
        setItems((list) => [m, ...list]);
        toast(t("media.uploaded", { name: file.name }));
        setJobs((j) => j.filter((x) => x.key !== key));
      } catch {
        setJobs((j) => j.map((x) => (x.key === key ? { ...x, error: "1" } : x)));
        toast.error(t("media.failed", { name: file.name }));
        setTimeout(() => setJobs((j) => j.filter((x) => x.key !== key)), 3000);
      }
    }
    router.refresh();
  };

  const shown = items.filter((m) => m.filename.toLowerCase().includes(q.toLowerCase()));

  return (
    <div
      onDragOver={(e) => {
        if (!canEdit) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (canEdit && e.dataTransfer.files.length) upload(e.dataTransfer.files);
      }}
      className="relative"
    >
      {canEdit && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn(
            "mb-5 flex w-full flex-col items-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors duration-150",
            over
              ? "border-primary bg-blue-100/60 dark:bg-blue-600/10"
              : "border-border-strong/50 hover:border-primary",
          )}
        >
          <Upload
            aria-hidden
            className={cn("size-6 text-link transition-transform", over && "-translate-y-1")}
          />
          <span className="text-sm font-medium">{t("media.drop")}</span>
          <span className="text-xs text-fg-muted">{t("media.dropHint")}</span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        aria-label="Upload images"
        tabIndex={-1}
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />

      <AnimatePresence>
        {jobs.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 space-y-2"
            aria-live="polite"
          >
            {jobs.map((j) => (
              <li key={j.key} className="border border-border bg-surface px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{j.name}</span>
                  <span className="text-fg-muted tabular-nums">{j.error ? "✕" : `${j.pct}%`}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden bg-surface-2">
                  <div
                    className={cn(
                      "h-full transition-[width] duration-200",
                      j.error ? "bg-yellow-500" : "bg-primary",
                    )}
                    style={{ width: `${j.error ? 100 : j.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <div className="relative mb-4 w-full sm:w-72">
        <Search
          aria-hidden
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("media.search")}
          aria-label={t("media.search")}
          className="ps-9"
        />
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState title={t("media.empty")} body={t("media.emptyBody")} />
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((m, i) => (
            <motion.li
              key={m.id}
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: Math.min(i, 15) * 0.02 } }}
              className="group"
            >
              <button type="button" onClick={() => setOpen(m)} className="block w-full text-start">
                <span className="relative block aspect-square overflow-hidden border border-border bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.alt_en || ""}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="mt-1.5 block truncate text-xs">{m.filename}</span>
                <span className="block text-[0.6875rem] text-fg-muted">
                  {kb(m.size)} ·{" "}
                  {format.dateTime(new Date(m.created_at), {
                    dateStyle: "medium",
                    numberingSystem: "latn",
                  })}
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      {open && (
        <MediaSheet
          key={open.id}
          media={open}
          canEdit={canEdit}
          onClose={() => setOpen(null)}
          onDeleted={(id) => setItems((l) => l.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}

function MediaSheet({
  media,
  canEdit,
  onClose,
  onDeleted,
}: {
  media: UploadedMedia;
  canEdit: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("dash");
  const [alt, setAlt] = useState({ en: media.alt_en, ar: media.alt_ar });
  const [usage, setUsage] = useState<string[] | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    mediaUsage(media.url).then(setUsage);
  }, [media.url]);

  const copy = async () => {
    await navigator.clipboard.writeText(new URL(media.url, location.origin).toString());
    toast(t("media.copied"));
  };

  return (
    <D.Root open onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={media.filename}>
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <SheetTitle className="truncate text-base font-medium">{media.filename}</SheetTitle>
          <DashButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X />
          </DashButton>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid aspect-video place-items-center overflow-hidden border border-border bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.url} alt={alt.en} className="max-h-full max-w-full object-contain" />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-fg-muted">Type</dt>
              <dd>{media.mime}</dd>
            </div>
            <div>
              <dt className="text-xs text-fg-muted">Size</dt>
              <dd dir="ltr">{kb(media.size)}</dd>
            </div>
          </dl>
          <div className="flex gap-2">
            <Input readOnly value={media.url} dir="ltr" aria-label="URL" className="flex-1" />
            <DashButton onClick={copy}>
              <Copy />
              {t("media.copy")}
            </DashButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="alt-en">{t("media.alt")} · EN</Label>
              <Input
                id="alt-en"
                dir="ltr"
                value={alt.en}
                disabled={!canEdit}
                onChange={(e) => setAlt((a) => ({ ...a, en: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="alt-ar">{t("media.alt")} · AR</Label>
              <Input
                id="alt-ar"
                dir="rtl"
                value={alt.ar}
                disabled={!canEdit}
                onChange={(e) => setAlt((a) => ({ ...a, ar: e.target.value }))}
              />
            </div>
          </div>
          {canEdit && (
            <DashButton
              variant="primary"
              size="sm"
              onClick={async () => {
                const r = await updateMediaAlt(media.id, alt);
                if (r.ok) toast(t("form.saved"));
                else toast.error(t("common.error"));
              }}
            >
              {t("form.save")}
            </DashButton>
          )}
          <section>
            <h3 className="mb-2 text-xs font-medium text-fg-muted">{t("media.usedIn")}</h3>
            {usage === null ? null : usage.length ? (
              <ul className="space-y-1 text-sm">
                {usage.map((u) => (
                  <li key={u} className="flex items-center gap-2">
                    <span aria-hidden className="size-1.5 bg-link" />
                    {u}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">{t("media.notUsed")}</p>
            )}
          </section>
        </div>
        {canEdit && (
          <footer className="border-t border-border px-5 py-3">
            <DashButton variant="warning" onClick={() => setConfirm(true)}>
              <Trash2 />
              {t("form.delete")}
            </DashButton>
          </footer>
        )}
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t("form.deleteTitle", { name: media.filename })}
          body={usage?.length ? t("media.deleteUsed", { n: usage.length }) : t("form.deleteBody")}
          confirmLabel={t("form.delete")}
          cancelLabel={t("common.cancel")}
          onConfirm={async () => {
            const r = await deleteMedia(media.id);
            if (r.ok) {
              toast(t("form.deleted"));
              onDeleted(media.id);
              onClose();
            } else toast.error(t("common.error"));
          }}
        />
      </SheetContent>
    </D.Root>
  );
}
