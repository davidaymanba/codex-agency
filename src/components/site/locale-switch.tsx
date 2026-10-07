"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Switches language while staying on the same page. */
export function LocaleSwitch({ className }: { className?: string }) {
  const t = useTranslations("locale");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";

  return (
    <Link
      href={pathname}
      locale={other}
      hrefLang={other}
      aria-label={t("switchTo")}
      className={cn(
        "grid h-10 min-w-10 place-items-center px-2 text-sm font-medium text-fg transition-colors hover:text-link",
        other === "ar"
          ? "font-[family-name:var(--font-rubik)]"
          : "font-[family-name:var(--font-montreal)]",
        className,
      )}
    >
      <span lang={other}>{t("short")}</span>
    </Link>
  );
}
