"use client";

import { useLocale } from "next-intl";
import { getDirection } from "@/i18n/routing";

/**
 * `sign` is 1 in LTR and -1 in RTL. Multiply any horizontal motion value by it so
 * marquees, slide-ins, horizontal scroll and arrows mirror automatically.
 */
export function useDirection() {
  const locale = useLocale();
  const dir = getDirection(locale);
  return { dir, isRTL: dir === "rtl", sign: dir === "rtl" ? -1 : 1, locale } as const;
}
