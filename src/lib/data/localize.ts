import type { Locale } from "@/i18n/routing";
import type { LocalizedText } from "@/content/types";

/** Picks `${field}_${locale}` from a row with `_en` / `_ar` columns. */
export function pick<R extends Record<string, unknown>, F extends string>(
  row: R,
  field: F,
  locale: Locale,
): string {
  return String(row[`${field}_${locale}` as keyof R] ?? row[`${field}_en` as keyof R] ?? "");
}

export const pickText = (t: LocalizedText, locale: Locale) => t[locale] ?? t.en;
