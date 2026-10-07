"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { deleteProject, saveProject } from "@/app/[locale]/dashboard/content/actions";
import { Link } from "@/i18n/navigation";
import { projectSchema, SERVICE_SLUGS } from "@/lib/schemas/content";
import {
  ChipsField,
  GalleryField,
  ImageField,
  LocField,
  ResultsField,
  SelectField,
  SwitchField,
  TagsField,
  TextField,
} from "../form/fields";
import { RichField } from "../form/rich-editor";
import { FormTabs } from "../form/tabs";
import { useFormGuard } from "../form/use-form-guard";
import { useCan } from "../shell/user-context";
import { DashButton } from "../ui/dash-button";
import { ConfirmDialog } from "../ui/overlays";
import { Card } from "../ui/primitives";

type Tab = "basics" | "content" | "media" | "seo";
const TAB_FIELDS: Record<Tab, string[]> = {
  basics: [
    "slug",
    "title",
    "summary",
    "category",
    "client_name",
    "year",
    "tags",
    "live_url",
    "services",
    "featured",
    "status",
  ],
  content: ["challenge", "approach", "results", "content_en", "content_ar"],
  media: ["cover_image", "cover_style", "gallery"],
  seo: ["seo_title", "seo_description"],
};

/**
 * Full project editor: tabs (basics / content / media / SEO), bilingual fields side by side,
 * rich text per language, cover + gallery with drag ordering, draft/publish, live preview,
 * Ctrl/⌘+S, unsaved-changes guard.
 */
export function ProjectEditor({ id, initial }: { id: string | null; initial: FieldValues }) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const router = useRouter();
  const canEdit = useCan("editor");
  const [tab, setTab] = useState<Tab>("basics");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const form = useForm<FieldValues>({
    resolver: zodResolver(projectSchema as never),
    defaultValues: initial,
    mode: "onTouched",
  });
  const errorTabs = (Object.keys(TAB_FIELDS) as Tab[]).filter((k) =>
    TAB_FIELDS[k].some((f) => f in form.formState.errors),
  );

  const save = form.handleSubmit(
    async (values) => {
      const r = await saveProject(id, values);
      if (r.ok) {
        toast(t("form.saved"));
        form.reset(values);
        if (!id && r.data) router.replace(`/${locale}/dashboard/projects/${r.data}`);
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
              aria-label={t("common.backToOverview")}
              onClick={() => confirmLeave(() => router.push(`/${locale}/dashboard/projects`))}
            >
              <ArrowLeft className="rtl:-scale-x-100" />
            </DashButton>
            <div className="min-w-0">
              <p className="label-mono text-fg-muted">
                {id ? t("projects.editProject") : t("projects.newProject")}
              </p>
              <h1 className="truncate font-display text-title font-bold" dir="auto">
                {form.watch("title.en") || t("projects.newProject")}
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
              <DashButton asChild title={t("projects.previewHint")}>
                <a
                  href={`/api/dashboard/preview?type=project&slug=${encodeURIComponent(slug)}&locale=${locale}`}
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
                { value: "basics", label: t("projects.basics") },
                { value: "content", label: t("projects.contentTab") },
                { value: "media", label: t("projects.mediaTab") },
                { value: "seo", label: t("projects.seoTab") },
              ]}
            />
          </div>
          <fieldset disabled={!canEdit} className="space-y-6 p-5 md:p-6">
            <div hidden={tab !== "basics"} className="space-y-5">
              <LocField name="title" label={t("fields.title")} />
              <LocField name="summary" label={t("fields.summary")} multiline />
              <div className="grid gap-4 md:grid-cols-3">
                <TextField name="slug" label={t("fields.slug")} dir="ltr" />
                <SelectField
                  name="category"
                  label={t("fields.category")}
                  options={["development", "branding", "marketing", "ai"].map((c) => ({
                    value: c,
                    label: c,
                  }))}
                />
                <SelectField
                  name="status"
                  label={t("fields.status")}
                  options={[
                    { value: "draft", label: t("projects.draft") },
                    { value: "published", label: t("projects.published") },
                  ]}
                />
                <TextField name="client_name" label={t("fields.client_name")} />
                <TextField name="year" type="number" label={t("fields.year")} dir="ltr" />
                <TextField name="live_url" label={t("fields.live_url")} dir="ltr" />
              </div>
              <TagsField name="tags" label={t("fields.tags")} />
              <ChipsField
                name="services"
                label={t("fields.services")}
                options={SERVICE_SLUGS.map((s) => ({ value: s, label: s }))}
              />
              <SwitchField name="featured" label={t("fields.featured")} />
            </div>

            <div hidden={tab !== "content"} className="space-y-5">
              <LocField name="challenge" label={t("fields.challenge")} multiline rows={4} />
              <LocField name="approach" label={t("fields.approach")} multiline rows={4} />
              <ResultsField
                name="results"
                label={t("fields.results")}
                hint={t("projects.resultsHint")}
              />
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

            <div hidden={tab !== "media"} className="space-y-5">
              <ImageField name="cover_image" label={t("fields.cover_image")} />
              <SelectField
                name="cover_style"
                label={t("fields.cover_style")}
                options={["grid", "blocks", "brackets", "chart", "flow"].map((c) => ({
                  value: c,
                  label: c,
                }))}
              />
              <GalleryField name="gallery" label={t("fields.gallery")} />
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
        title={t("form.deleteTitle", { name: form.getValues("title.en") })}
        body={t("form.deleteBody")}
        confirmLabel={t("form.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={async () => {
          const r = id ? await deleteProject(id) : { ok: false };
          if (r.ok) {
            toast(t("form.deleted"));
            form.reset(form.getValues());
            router.push(`/${locale}/dashboard/projects`);
          } else toast.error(t("common.error"));
        }}
      />
      <Link href="/dashboard/projects" className="sr-only">
        {t("sections.projects")}
      </Link>
    </FormProvider>
  );
}
