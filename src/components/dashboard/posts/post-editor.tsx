"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type FieldValues,
} from "react-hook-form";
import { toast } from "sonner";
import { deletePost, savePost } from "@/app/[locale]/dashboard/content/actions";
import { postSchema } from "@/lib/schemas/content";
import {
  FieldShell,
  ImageField,
  LocField,
  SelectField,
  TagsField,
  TextField,
} from "../form/fields";
import { RichField } from "../form/rich-editor";
import { FormTabs } from "../form/tabs";
import { useFormGuard } from "../form/use-form-guard";
import { useCan } from "../shell/user-context";
import { DashButton } from "../ui/dash-button";
import { ConfirmDialog } from "../ui/overlays";
import { Card, Input } from "../ui/primitives";

type Tab = "content" | "settings" | "seo";
const TAB_FIELDS: Record<Tab, string[]> = {
  content: ["title", "excerpt", "content_en", "content_ar"],
  settings: ["slug", "cover_image", "cover_style", "tags", "author_name", "status", "published_at"],
  seo: ["seo_title", "seo_description"],
};

/** ISO string <-> <input type="datetime-local"> (local time). */
function DateTimeField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const { control } = useFormContext();
  const te = useTranslations("dash.form.errors");
  const id = useId();
  const toLocal = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          hint={hint}
          htmlFor={id}
          error={fieldState.error ? te("date") : undefined}
        >
          <Input
            id={id}
            type="datetime-local"
            dir="ltr"
            value={toLocal(field.value)}
            onChange={(e) =>
              field.onChange(e.target.value ? new Date(e.target.value).toISOString() : "")
            }
          />
        </FieldShell>
      )}
    />
  );
}

/** Post editor: bilingual title/excerpt, Tiptap per language (RTL for Arabic), cover, tags, SEO, scheduling. */
export function PostEditor({ id, initial }: { id: string | null; initial: FieldValues }) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const router = useRouter();
  const canEdit = useCan("editor");
  const [tab, setTab] = useState<Tab>("content");
  const [lang, setLang] = useState<"en" | "ar">(locale === "ar" ? "ar" : "en");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useForm<FieldValues>({
    resolver: zodResolver(postSchema as never),
    defaultValues: initial,
    mode: "onTouched",
  });
  const errorTabs = (Object.keys(TAB_FIELDS) as Tab[]).filter((k) =>
    TAB_FIELDS[k].some((f) => f in form.formState.errors),
  );

  const save = form.handleSubmit(
    async (values) => {
      const r = await savePost(id, values);
      if (r.ok) {
        toast(t("form.saved"));
        form.reset(values);
        if (!id && r.data) router.replace(`/${locale}/dashboard/posts/${r.data}`);
        else router.refresh();
      } else if (r.issues) {
        r.issues.forEach((i) => form.setError(i.path as never, { message: i.message }));
        toast.error(t("form.fixErrors"));
      } else toast.error(r.error === "forbidden" ? t("common.forbidden") : t("common.error"));
    },
    () => toast.error(t("form.fixErrors")),
  );
  const { confirmLeave, dialog } = useFormGuard({ dirty: form.formState.isDirty, onSave: save });
  const slug = form.watch("slug");

  return (
    <FormProvider {...form}>
      <form onSubmit={save} noValidate>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <DashButton
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("sections.posts")}
              onClick={() => confirmLeave(() => router.push(`/${locale}/dashboard/posts`))}
            >
              <ArrowLeft className="rtl:-scale-x-100" />
            </DashButton>
            <div className="min-w-0">
              <p className="label-mono text-fg-muted">
                {id ? t("posts.editPost") : t("posts.newPost")}
              </p>
              <h1 className="truncate font-display text-title font-bold" dir="auto">
                {form.watch(`title.${lang}`) || t("posts.newPost")}
              </h1>
            </div>
            {form.formState.isDirty && (
              <span className="shrink-0 bg-yellow-200 px-2 py-1 label-mono text-navy-950">
                {t("form.unsaved")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {id && slug && (
              <DashButton asChild>
                <a
                  href={`/api/dashboard/preview?type=post&slug=${encodeURIComponent(slug)}&locale=${locale}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink />
                  {t("form.preview")}
                </a>
              </DashButton>
            )}
            {id && canEdit && (
              <DashButton type="button" variant="warning" onClick={() => setConfirmDelete(true)}>
                <Trash2 />
                {t("form.delete")}
              </DashButton>
            )}
            {canEdit && (
              <DashButton type="submit" variant="primary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                {form.formState.isSubmitting ? t("form.saving") : t("form.save")}
              </DashButton>
            )}
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="px-5">
            <FormTabs
              value={tab}
              onChange={setTab}
              errors={errorTabs}
              tabs={[
                { value: "content", label: t("projects.contentTab") },
                { value: "settings", label: t("projects.basics") },
                { value: "seo", label: t("projects.seoTab") },
              ]}
            />
          </div>
          <fieldset disabled={!canEdit} className="space-y-6 p-5 md:p-6">
            <div hidden={tab !== "content"} className="space-y-5">
              <LocField name="title" label={t("fields.title")} />
              <LocField name="excerpt" label={t("fields.excerpt")} multiline rows={2} />
              <div>
                <div className="mb-2 flex gap-1">
                  {(["en", "ar"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={
                        l === lang
                          ? "bg-primary px-3 py-1 text-xs text-white"
                          : "border border-border px-3 py-1 text-xs"
                      }
                    >
                      {l === "en" ? t("form.english") : t("form.arabic")}
                    </button>
                  ))}
                </div>
                <div hidden={lang !== "en"}>
                  <RichField name="content_en" label={`${t("fields.content")} · EN`} dir="ltr" />
                </div>
                <div hidden={lang !== "ar"}>
                  <RichField name="content_ar" label={`${t("fields.content")} · AR`} dir="rtl" />
                </div>
              </div>
            </div>

            <div hidden={tab !== "settings"} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField name="slug" label={t("fields.slug")} dir="ltr" />
                <TextField name="author_name" label={t("fields.author")} />
                <SelectField
                  name="status"
                  label={t("fields.status")}
                  options={[
                    { value: "draft", label: t("posts.draft") },
                    { value: "published", label: t("posts.published") },
                    { value: "scheduled", label: t("posts.scheduled") },
                  ]}
                />
                <DateTimeField
                  name="published_at"
                  label={t("fields.published_at")}
                  hint={t("posts.scheduleHint")}
                />
              </div>
              <TagsField name="tags" label={t("fields.tags")} />
              <ImageField name="cover_image" label={t("fields.cover_image")} />
              <SelectField
                name="cover_style"
                label={t("fields.cover_style")}
                options={["grid", "blocks", "brackets", "chart", "flow"].map((c) => ({
                  value: c,
                  label: c,
                }))}
              />
            </div>

            <div hidden={tab !== "seo"} className="space-y-5">
              <LocField
                name="seo_title"
                label={`${t("fields.seo_title")} (${t("form.optional")})`}
              />
              <LocField
                name="seo_description"
                label={`${t("fields.seo_description")} (${t("form.optional")})`}
                multiline
                rows={2}
              />
            </div>
          </fieldset>
        </Card>
        <p className="mt-3 text-xs text-fg-muted">{t("form.shortcut")}</p>
      </form>
      {dialog}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("form.deleteTitle", { name: form.getValues(`title.${lang}`) })}
        body={t("form.deleteBody")}
        confirmLabel={t("form.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={async () => {
          const r = id ? await deletePost(id) : { ok: false };
          if (r.ok) {
            toast(t("form.deleted"));
            form.reset(form.getValues());
            router.push(`/${locale}/dashboard/posts`);
          } else toast.error(t("common.error"));
        }}
      />
    </FormProvider>
  );
}
