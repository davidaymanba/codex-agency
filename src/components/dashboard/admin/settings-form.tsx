"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveSettings } from "@/app/[locale]/dashboard/settings/actions";
import { settingsSchema, type SettingsInput } from "@/lib/schemas/settings";
import { LocField, SwitchField, TextField } from "../form/fields";
import { useFormGuard } from "../form/use-form-guard";
import { useCan } from "../shell/user-context";
import { DashButton } from "../ui/dash-button";
import { Card, CardHeader } from "../ui/primitives";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="space-y-5 p-5">
        {description && <p className="-mt-1 text-sm text-fg-muted">{description}</p>}
        {children}
      </div>
    </Card>
  );
}

/** Site settings: contact, socials, default SEO, announcement bar, maintenance mode (admin-only). */
export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const t = useTranslations("dash");
  const router = useRouter();
  const canEdit = useCan("editor");
  const isAdmin = useCan("admin");
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
    mode: "onTouched",
  });

  const save = form.handleSubmit(
    async (values) => {
      const r = await saveSettings(values);
      if (r.ok) {
        toast(t("form.saved"));
        form.reset(values);
        router.refresh();
      } else if (r.issues) {
        r.issues.forEach((i) => form.setError(i.path as never, { message: i.message }));
        toast.error(t("form.fixErrors"));
      } else toast.error(r.error === "forbidden" ? t("common.forbidden") : t("common.error"));
    },
    () => toast.error(t("form.fixErrors")),
  );
  const { dialog } = useFormGuard({ dirty: form.formState.isDirty, onSave: save });

  return (
    <FormProvider {...form}>
      <form onSubmit={save} noValidate className="space-y-5 pb-24">
        <fieldset disabled={!canEdit} className="space-y-5">
          <Section title={t("settings.contact")}>
            <div className="grid gap-4 md:grid-cols-3">
              <TextField name="email" type="email" label={t("settings.email")} dir="ltr" />
              <TextField
                name="phone"
                label={t("settings.phone")}
                dir="ltr"
                hint={t("settings.phoneHint")}
              />
              <TextField
                name="whatsapp"
                label={t("settings.whatsapp")}
                dir="ltr"
                hint={t("settings.whatsappHint")}
              />
            </div>
            <LocField name="address" label={t("settings.address")} />
          </Section>

          <Section title={t("settings.socials")}>
            <div className="grid gap-4 md:grid-cols-2">
              {(["instagram", "linkedin", "behance", "x", "tiktok"] as const).map((k) => (
                <TextField
                  key={k}
                  name={`socials.${k}`}
                  label={k === "x" ? "X" : k[0].toUpperCase() + k.slice(1)}
                  dir="ltr"
                />
              ))}
            </div>
          </Section>

          <Section title={t("settings.seo")} description={t("settings.seoHint")}>
            <LocField name="seo_title" label={t("fields.seo_title")} />
            <LocField
              name="seo_description"
              label={t("fields.seo_description")}
              multiline
              rows={2}
            />
          </Section>

          <Section title={t("settings.announcement")} description={t("settings.announcementHint")}>
            <SwitchField name="announcement_enabled" label={t("settings.announcementOn")} />
            <LocField name="announcement" label={t("settings.announcementText")} />
            <TextField
              name="announcement_href"
              label={t("settings.announcementLink")}
              dir="ltr"
              hint="/ai-automation · https://…"
            />
          </Section>

          <Section title={t("settings.maintenance")}>
            <div className="flex items-start gap-3 border-s-2 border-yellow-500 bg-yellow-50 px-4 py-3 text-sm text-navy-950 dark:bg-yellow-500/10 dark:text-fg">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>{t("settings.maintenanceHint")}</p>
            </div>
            <fieldset disabled={!isAdmin}>
              <SwitchField
                name="maintenance"
                label={t("settings.maintenanceOn")}
                description={!isAdmin ? t("settings.adminOnly") : undefined}
              />
            </fieldset>
          </Section>
        </fieldset>

        {canEdit && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border glass lg:start-auto lg:w-[calc(100%-var(--dash-sidebar,16rem))]">
            <div className="flex items-center justify-end gap-3 px-4 py-3 md:px-8">
              {form.formState.isDirty && (
                <span className="me-auto bg-yellow-200 px-2 py-1 label-mono text-navy-950">
                  {t("form.unsaved")}
                </span>
              )}
              <span className="hidden text-xs text-fg-muted sm:block">{t("form.shortcut")}</span>
              <DashButton
                type="button"
                disabled={!form.formState.isDirty}
                onClick={() => form.reset(initial)}
              >
                {t("common.cancel")}
              </DashButton>
              <DashButton
                type="submit"
                variant="primary"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
              >
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                {t("form.save")}
              </DashButton>
            </div>
          </div>
        )}
      </form>
      {dialog}
    </FormProvider>
  );
}
