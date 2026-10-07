import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";

/** Shown to visitors while maintenance mode is on (team members still see the site). */
export async function MaintenancePage({ email }: { email: string }) {
  const t = await getTranslations("maintenance");
  return (
    <main className="grid min-h-dvh place-items-center bg-grid px-6 text-center">
      <div className="max-w-lg">
        <Logo title="CODEX" className="mx-auto w-40 text-primary dark:text-white" />
        <h1 className="mt-10 font-display text-headline font-bold">{t("title")}</h1>
        <p className="mt-4 text-lead text-fg-muted">{t("body")}</p>
        <a
          href={`mailto:${email}`}
          className="mt-8 inline-block text-link underline underline-offset-4"
        >
          {email}
        </a>
      </div>
    </main>
  );
}
