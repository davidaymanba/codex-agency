import type { TechLogoRow } from "./types";

const row = (marquee_row: 1 | 2, items: [string, string | null][]): TechLogoRow[] =>
  items.map(([name, icon], i) => ({
    id: `tech-${marquee_row}-${i}`,
    name,
    icon,
    marquee_row,
    sort_order: i + 1,
    published: true,
  }));

// PLACEHOLDER content — becomes seed data for `tech_logos`.
export const techLogos: TechLogoRow[] = [
  ...row(1, [
    ["Shopify", "siShopify"],
    ["Salla", "siSalla"],
    ["WordPress", "siWordpress"],
    ["WooCommerce", "siWoocommerce"],
    ["Next.js", "siNextdotjs"],
    ["React", "siReact"],
    ["Laravel", "siLaravel"],
    ["Node.js", "siNodedotjs"],
    ["Flutter", "siFlutter"],
    ["Supabase", "siSupabase"],
  ]),
  ...row(2, [
    ["n8n", "siN8n"],
    ["OpenAI", null],
    ["Claude", "siClaude"],
    ["Gemini", "siGooglegemini"],
    ["WhatsApp API", "siWhatsapp"],
    ["Meta Ads", "siMeta"],
    ["Google Ads", "siGoogleads"],
    ["TikTok Ads", "siTiktok"],
    ["HubSpot", "siHubspot"],
    ["Figma", "siFigma"],
  ]),
];
