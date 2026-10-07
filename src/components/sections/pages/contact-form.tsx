"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import Script from "next/script";
import { useForm, type FieldError } from "react-hook-form";
import { submitLead } from "@/app/[locale]/(site)/contact/actions";
import { Button } from "@/components/ui/button";
import { LEAD_BUDGETS, LEAD_SERVICES, leadSchema, type LeadInput } from "@/lib/schemas/lead";
import { cn } from "@/lib/utils";

/** Optional bot check — only rendered when the Turnstile site key is configured. */
const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const fieldCls =
  "w-full border border-border bg-surface px-4 py-3.5 text-fg transition-colors outline-none placeholder:text-fg-muted/70 hover:border-border-strong focus:border-primary aria-[invalid=true]:border-yellow-500";

function Field({
  label,
  error,
  children,
  id,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 flex items-center gap-2 text-sm">
          <span aria-hidden className="size-2 shrink-0 bg-yellow-500" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Contact form: react-hook-form + the shared zod schema; honeypot; success state. */
export function ContactForm() {
  const t = useTranslations("pages.contact");
  const locale = useLocale() as "en" | "ar";
  const uid = useId();
  const [status, setStatus] = useState<"idle" | "done" | "error" | "limited">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({ resolver: zodResolver(leadSchema), mode: "onTouched" });

  const err = (e?: FieldError) => (e?.message ? t(`errors.${e.message as "required"}`) : undefined);
  const a11y = (name: keyof LeadInput) => ({
    id: `${uid}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-err` : undefined,
  });

  const onSubmit = async (data: LeadInput) => {
    const params = new URLSearchParams(window.location.search);
    const utm = Object.fromEntries([...params].filter(([k]) => k.startsWith("utm_")));
    const turnstileToken =
      (document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null)
        ?.value || undefined;
    const res = await submitLead(data, {
      turnstileToken,
      locale,
      sourcePage: document.referrer || window.location.pathname,
      utm,
    });
    setStatus(res.ok ? "done" : res.error === "rate_limited" ? "limited" : "error");
    if (res.ok) reset();
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "done" ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role="status"
          className="flex min-h-[28rem] flex-col items-start justify-center rounded-[var(--radius-brand)] border border-border bg-surface p-8 md:p-12"
        >
          <span className="grid size-14 place-items-center bg-primary text-white">
            <CheckCircle2 aria-hidden className="size-7" />
          </span>
          <h2 className="mt-8 font-display text-headline font-bold">{t("successTitle")}</h2>
          <p className="mt-3 max-w-md text-lead text-fg-muted">{t("successBody")}</p>
          <Button variant="secondary" className="mt-8" onClick={() => setStatus("idle")}>
            {t("sendAnother")}
          </Button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8 }}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="grid gap-6 rounded-[var(--radius-brand)] border border-border bg-surface/60 p-6 backdrop-blur md:grid-cols-2 md:p-10"
        >
          {/* Honeypot: hidden from people and assistive tech */}
          <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" {...register("website")} />
            </label>
          </div>

          <Field id={`${uid}-name`} label={t("name")} error={err(errors.name)}>
            <input
              {...register("name")}
              {...a11y("name")}
              autoComplete="name"
              className={fieldCls}
            />
          </Field>
          <Field id={`${uid}-email`} label={t("email")} error={err(errors.email)}>
            <input
              {...register("email")}
              {...a11y("email")}
              type="email"
              autoComplete="email"
              dir="ltr"
              className={cn(fieldCls, "rtl:text-end")}
            />
          </Field>
          <Field id={`${uid}-phone`} label={t("phone")} error={err(errors.phone)}>
            <input
              {...register("phone")}
              {...a11y("phone")}
              type="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="+966 5x xxx xxxx"
              className={cn(fieldCls, "rtl:text-end")}
            />
          </Field>
          <Field id={`${uid}-company`} label={t("company")} error={err(errors.company)}>
            <input
              {...register("company")}
              {...a11y("company")}
              autoComplete="organization"
              className={fieldCls}
            />
          </Field>

          <fieldset
            className="md:col-span-2"
            aria-invalid={errors.service ? true : undefined}
            aria-describedby={errors.service ? `${uid}-service-err` : undefined}
          >
            <legend className="mb-3 text-sm font-medium">{t("service")}</legend>
            <div className="flex flex-wrap gap-2">
              {LEAD_SERVICES.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="radio" value={s} {...register("service")} className="peer sr-only" />
                  <span className="block border border-border px-4 py-2.5 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] hover:border-border-strong">
                    {t(`services.${s}`)}
                  </span>
                </label>
              ))}
            </div>
            {errors.service && (
              <p
                id={`${uid}-service-err`}
                role="alert"
                className="mt-2 flex items-center gap-2 text-sm"
              >
                <span aria-hidden className="size-2 bg-yellow-500" />
                {err(errors.service)}
              </p>
            )}
          </fieldset>

          <fieldset
            className="md:col-span-2"
            aria-describedby={errors.budget ? `${uid}-budget-err` : undefined}
          >
            <legend className="mb-3 text-sm font-medium">{t("budget")}</legend>
            <div className="flex flex-wrap gap-2">
              {LEAD_BUDGETS.map((b) => (
                <label key={b} className="cursor-pointer">
                  <input type="radio" value={b} {...register("budget")} className="peer sr-only" />
                  <span className="block border border-border px-4 py-2.5 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] hover:border-border-strong">
                    {t(`budgets.${b}`)}
                  </span>
                </label>
              ))}
            </div>
            {errors.budget && (
              <p
                id={`${uid}-budget-err`}
                role="alert"
                className="mt-2 flex items-center gap-2 text-sm"
              >
                <span aria-hidden className="size-2 bg-yellow-500" />
                {err(errors.budget)}
              </p>
            )}
          </fieldset>

          <div className="md:col-span-2">
            <Field id={`${uid}-message`} label={t("message")} error={err(errors.message)}>
              <textarea
                {...register("message")}
                {...a11y("message")}
                rows={6}
                placeholder={t("messagePlaceholder")}
                className={cn(fieldCls, "resize-y")}
              />
            </Field>
          </div>

          {status === "limited" && (
            <p
              role="alert"
              className="border-s-4 border-yellow-500 bg-yellow-50 px-4 py-3 text-sm text-navy-950 md:col-span-2"
            >
              {t("rateLimited")}
            </p>
          )}
          {status === "error" && (
            <p
              role="alert"
              className="border-s-4 border-yellow-500 bg-yellow-50 px-4 py-3 text-sm text-navy-950 md:col-span-2"
            >
              {t("error")}
            </p>
          )}

          {TURNSTILE_KEY && (
            <div className="md:col-span-2">
              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              <div
                className="cf-turnstile"
                data-sitekey={TURNSTILE_KEY}
                data-theme="auto"
                data-language={locale}
              />
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
            <p className="text-sm text-fg-muted">{t("privacy")}</p>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              icon={
                isSubmitting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : undefined
              }
            >
              {isSubmitting ? t("sending") : t("submit")}
            </Button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
