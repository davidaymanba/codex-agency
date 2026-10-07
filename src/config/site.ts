/**
 * Static site config. PLACEHOLDER contact data — from Phase 2 on, these values are
 * read from the `site_settings` table and this file only provides fallbacks.
 */
export const siteConfig = {
  name: "CODEX",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hello@codex.agency", // placeholder
  phone: "+20 100 000 0000", // placeholder
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "201000000000", // placeholder, digits only
  markets: ["EG", "SA", "AE", "KW", "OM"] as const,
  socials: {
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
    behance: "https://behance.net/",
    x: "https://x.com/",
    tiktok: "https://tiktok.com/",
  },
} as const;

/** WhatsApp deep link. Pass the number from site settings; falls back to the static placeholder. */
export const whatsappHref = (number?: string, text?: string) =>
  `https://wa.me/${(number || siteConfig.whatsapp).replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Primary navigation — keys map to `nav.*` messages. */
export const mainNav = [
  { key: "services", href: "/services" },
  { key: "solutions", href: "/solutions" },
  { key: "ai", href: "/ai-automation" },
  { key: "work", href: "/work" },
  { key: "about", href: "/about" },
  { key: "blog", href: "/blog" },
] as const;
