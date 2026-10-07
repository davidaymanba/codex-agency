"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import {
  useForm,
  type FieldError,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { acceptInvite, requestEmail, resetPassword, signIn } from "@/app/[locale]/(auth)/actions";
import { DashButton } from "@/components/dashboard/ui/dash-button";
import { FieldError as Err, Input, Label } from "@/components/dashboard/ui/primitives";
import { Segmented } from "@/components/dashboard/ui/segmented";
import { Link } from "@/i18n/navigation";
import { emailOnlySchema, inviteSchema, loginSchema, resetSchema } from "@/lib/schemas/auth";

type ErrKey =
  | "email"
  | "password"
  | "passwordLength"
  | "mismatch"
  | "required"
  | "credentials"
  | "unavailable"
  | "invalid"
  | "locked";

function useErr() {
  const t = useTranslations("dash.auth.errors");
  return (e?: FieldError | string) => {
    const key = typeof e === "string" ? e : e?.message;
    return key ? t(key as ErrKey) : undefined;
  };
}

function TextField<T extends FieldValues>({
  name,
  label,
  type = "text",
  register,
  error,
  autoComplete,
  ltr,
}: {
  name: Path<T>;
  label: string;
  type?: string;
  register: UseFormRegister<T>;
  error?: string;
  autoComplete?: string;
  ltr?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        dir={ltr ? "ltr" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : undefined}
        className="h-11 rtl:text-end"
        {...register(name)}
      />
      <Err id={`${id}-e`}>{error}</Err>
    </div>
  );
}

function Heading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-headline font-bold">{title}</h1>
      {body && <p className="mt-2 text-fg-muted">{body}</p>}
    </div>
  );
}

function Done({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 border border-border bg-surface p-4 text-sm"
    >
      <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-link" />
      <p>{children}</p>
    </div>
  );
}

function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <DashButton type="submit" variant="primary" disabled={busy} className="h-11 w-full">
      {busy && <Loader2 aria-hidden className="animate-spin" />}
      {children}
    </DashButton>
  );
}

/* ---------------------------------------------------------------- Login */

export function LoginForm({ next, devHint }: { next?: string; devHint: boolean }) {
  const t = useTranslations("dash.auth");
  const locale = useLocale();
  const err = useErr();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [serverErr, setServerErr] = useState<ErrKey | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const pw = useForm({ resolver: zodResolver(loginSchema), mode: "onTouched" });
  const ml = useForm({ resolver: zodResolver(emailOnlySchema), mode: "onTouched" });

  return (
    <>
      <Heading title={t("loginTitle")} body={t("loginBody")} />
      <Segmented
        label={t("signIn")}
        value={mode}
        onChange={(v) => {
          setMode(v);
          setServerErr(null);
        }}
        className="mb-6 w-full [&>button]:flex-1"
        options={[
          {
            value: "password",
            label: (
              <>
                <KeyRound aria-hidden />
                {t("passwordTab")}
              </>
            ),
          },
          {
            value: "magic",
            label: (
              <>
                <Mail aria-hidden />
                {t("magicTab")}
              </>
            ),
          },
        ]}
      />

      {mode === "password" ? (
        <form
          noValidate
          className="space-y-4"
          onSubmit={pw.handleSubmit(async (data) => {
            setServerErr(null);
            const res = await signIn(locale, data, next);
            if (res && !res.ok) setServerErr(res.error);
          })}
        >
          <TextField
            name="email"
            label={t("email")}
            type="email"
            autoComplete="email"
            ltr
            register={pw.register}
            error={err(pw.formState.errors.email)}
          />
          <TextField
            name="password"
            label={t("password")}
            type="password"
            autoComplete="current-password"
            ltr
            register={pw.register}
            error={err(pw.formState.errors.password)}
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-link hover:underline">
              {t("forgot")}
            </Link>
          </div>
          {serverErr && <Err>{err(serverErr)}</Err>}
          <Submit busy={pw.formState.isSubmitting}>
            {pw.formState.isSubmitting ? t("signingIn") : t("signIn")}
          </Submit>
        </form>
      ) : magicSent ? (
        <Done>{t("magicSent")}</Done>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={ml.handleSubmit(async (data) => {
            const res = await requestEmail(data);
            if (res.ok) setMagicSent(true);
            else setServerErr(res.error);
          })}
        >
          <TextField
            name="email"
            label={t("email")}
            type="email"
            autoComplete="email"
            ltr
            register={ml.register}
            error={err(ml.formState.errors.email)}
          />
          <Submit busy={ml.formState.isSubmitting}>{t("sendMagic")}</Submit>
        </form>
      )}

      {devHint && (
        <p
          className="mt-8 border-s-2 border-yellow-500 bg-surface px-3 py-2 text-xs text-fg-muted"
          dir="ltr"
        >
          {t("devHint")}
        </p>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- Forgot */

export function ForgotForm() {
  const t = useTranslations("dash.auth");
  const err = useErr();
  const [sent, setSent] = useState(false);
  const f = useForm({ resolver: zodResolver(emailOnlySchema), mode: "onTouched" });
  return (
    <>
      <Heading title={t("forgotTitle")} body={t("forgotBody")} />
      {sent ? (
        <Done>{t("resetSent")}</Done>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={f.handleSubmit(async (d) => (await requestEmail(d)).ok && setSent(true))}
        >
          <TextField
            name="email"
            label={t("email")}
            type="email"
            autoComplete="email"
            ltr
            register={f.register}
            error={err(f.formState.errors.email)}
          />
          <Submit busy={f.formState.isSubmitting}>{t("sendReset")}</Submit>
        </form>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm text-link hover:underline">
        {t("backToLogin")}
      </Link>
    </>
  );
}

/* ---------------------------------------------------------------- Reset */

export function ResetForm() {
  const t = useTranslations("dash.auth");
  const err = useErr();
  const [state, setState] = useState<"idle" | "done" | ErrKey>("idle");
  const f = useForm({ resolver: zodResolver(resetSchema), mode: "onTouched" });
  return (
    <>
      <Heading title={t("resetTitle")} />
      {state === "done" ? (
        <Done>{t("passwordSaved")}</Done>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={f.handleSubmit(async (d) => {
            const r = await resetPassword(d);
            setState(r.ok ? "done" : r.error);
          })}
        >
          <TextField
            name="password"
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
            ltr
            register={f.register}
            error={err(f.formState.errors.password)}
          />
          <TextField
            name="confirm"
            label={t("confirmPassword")}
            type="password"
            autoComplete="new-password"
            ltr
            register={f.register}
            error={err(f.formState.errors.confirm)}
          />
          {state !== "idle" && <Err>{err(state)}</Err>}
          <Submit busy={f.formState.isSubmitting}>{t("savePassword")}</Submit>
        </form>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm text-link hover:underline">
        {t("backToLogin")}
      </Link>
    </>
  );
}

/* ---------------------------------------------------------------- Invite */

export function InviteForm({ token }: { token: string }) {
  const t = useTranslations("dash.auth");
  const err = useErr();
  const [state, setState] = useState<"idle" | "done" | ErrKey>("idle");
  const f = useForm({ resolver: zodResolver(inviteSchema), mode: "onTouched" });
  return (
    <>
      <Heading title={t("inviteTitle")} body={t("inviteBody")} />
      {state === "done" ? (
        <Done>
          {t("inviteDone")}{" "}
          <Link href="/login" className="text-link underline">
            {t("signIn")}
          </Link>
        </Done>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={f.handleSubmit(async (d) => {
            const r = await acceptInvite(token, d);
            setState(r.ok ? "done" : r.error);
          })}
        >
          <TextField
            name="fullName"
            label={t("fullName")}
            autoComplete="name"
            register={f.register}
            error={err(f.formState.errors.fullName as FieldError | undefined)}
          />
          <TextField
            name="password"
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
            ltr
            register={f.register}
            error={err(f.formState.errors.password)}
          />
          <TextField
            name="confirm"
            label={t("confirmPassword")}
            type="password"
            autoComplete="new-password"
            ltr
            register={f.register}
            error={err(f.formState.errors.confirm)}
          />
          {state !== "idle" && <Err>{err(state)}</Err>}
          <Submit busy={f.formState.isSubmitting}>{t("acceptInvite")}</Submit>
        </form>
      )}
    </>
  );
}
