/**
 * Static site config. Contact data is read from the `site_settings` table; the values here
 * are only fallbacks. `phone` / `whatsapp` may hold several comma-separated numbers.
 */
export const siteConfig = {
  name: "CODEX",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "info@codexai.systems",
  phone: "+20 120 780 9980, +20 102 902 0716",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "201207809980,201029020716", // digits only
  markets: ["EG", "SA", "AE", "KW", "OM"] as const,
  socials: {
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
    behance: "https://behance.net/",
    x: "https://x.com/",
    tiktok: "https://tiktok.com/",
  },
} as const;

/** Splits a comma-separated list of numbers from site settings. */
export const splitNumbers = (list: string) =>
  list
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

/** WhatsApp deep link for ONE number (digits only; other characters are stripped). */
export const whatsappHref = (number?: string, text?: string) =>
  `https://wa.me/${(number || splitNumbers(siteConfig.whatsapp)[0]).replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** `tel:` link for one display-formatted number. */
export const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;

/** Display form of a WhatsApp number stored as digits: "201207809980" → "+20 120 780 9980". */
export const formatWhatsapp = (digits: string) =>
  digits.startsWith("20") && digits.length === 12
    ? `+20 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
    : `+${digits}`;

/** Primary navigation — keys map to `nav.*` messages. */
export const mainNav = [
  { key: "services", href: "/services" },
  { key: "solutions", href: "/solutions" },
  { key: "ai", href: "/ai-automation" },
  { key: "work", href: "/work" },
  { key: "about", href: "/about" },
  { key: "blog", href: "/blog" },
] as const;
