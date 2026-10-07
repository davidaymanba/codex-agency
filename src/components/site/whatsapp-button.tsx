"use client";

import { useTranslations } from "next-intl";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { whatsappHref } from "@/config/site";
import { useSiteContact } from "./site-settings";

/** Floating WhatsApp entry point (bottom-end corner; mirrors in RTL). CSS-only motion. */
export function WhatsAppButton() {
  const t = useTranslations("whatsapp");
  const { whatsapp } = useSiteContact();
  return (
    <a
      href={whatsappHref(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("label")}
      className="group fixed end-5 bottom-5 z-40 grid size-14 animate-[wa-in_600ms_cubic-bezier(0.34,1.56,0.64,1)_1.2s_both] place-items-center text-white transition-transform duration-200 hover:scale-105 active:scale-95 motion-reduce:animate-none md:end-8 md:bottom-8"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[1rem] rounded-ss-none bg-primary shadow-[0_12px_32px_-12px_var(--color-blue-600)] transition-colors group-hover:bg-blue-400"
      />
      <span
        aria-hidden
        className="absolute inset-0 -z-20 animate-ping rounded-[1rem] rounded-ss-none bg-primary/40 [animation-duration:2.4s] motion-reduce:hidden"
      />
      <WhatsAppIcon className="size-6" />
      <span className="pointer-events-none absolute end-full me-3 hidden bg-fg px-3 py-1.5 text-sm whitespace-nowrap text-bg opacity-0 transition-opacity group-hover:opacity-100 md:block">
        {t("label")}
      </span>
    </a>
  );
}
