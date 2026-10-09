"use client";

import { createContext, useContext, type ReactNode } from "react";
import { siteConfig, splitNumbers } from "@/config/site";

type Contact = { email: string; phones: string[]; whatsapps: string[] };
const Ctx = createContext<Contact>({
  email: siteConfig.email,
  phones: splitNumbers(siteConfig.phone),
  whatsapps: splitNumbers(siteConfig.whatsapp),
});

/** Contact details from site settings, for client components (WhatsApp button, mobile menu). */
export function SiteSettingsProvider({ value, children }: { value: Contact; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSiteContact = () => useContext(Ctx);
