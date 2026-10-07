import { getTranslations } from "next-intl/server";
import { Broken404 } from "@/components/sections/pages/broken-404";
import { ButtonLink } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="relative isolate container-x flex min-h-[85dvh] flex-col justify-center gap-8 pt-[var(--header-h)] pb-16">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_30%_50%,#000_20%,transparent_70%)]"
      />
      <Broken404 rebuildLabel={t("rebuild")} />
      <div>
        <h1 className="max-w-2xl text-headline font-medium">{t("title")}</h1>
        <p className="mt-4 text-lead text-fg-muted">{t("body")}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/">{t("back")}</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          {t("contact")}
        </ButtonLink>
      </div>
    </section>
  );
}
