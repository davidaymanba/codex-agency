import { Clock, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/sections/pages/contact-form";
import { PageHero } from "@/components/sections/pages/page-hero";
import { formatWhatsapp, telHref, whatsappHref } from "@/config/site";
import { getSettings } from "@/lib/data/content";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return pageMetadata({ locale, path: "/contact", title: t("label"), description: t("intro") });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");
  const settings = await getSettings(locale);

  // One card per number (WhatsApp and phone can each list several).
  const channels = [
    ...settings.whatsapps.map((n) => ({
      icon: WhatsAppIcon,
      label: t("whatsappLabel"),
      value: formatWhatsapp(n),
      href: whatsappHref(n),
      ltr: true,
    })),
    {
      icon: Mail,
      label: t("emailLabel"),
      value: settings.email,
      href: `mailto:${settings.email}`,
      ltr: true,
    },
    ...settings.phones.map((n) => ({
      icon: Phone,
      label: t("phoneLabel"),
      value: n,
      href: telHref(n),
      ltr: true,
    })),
    { icon: Clock, label: t("hoursLabel"), value: t("hours"), href: null, ltr: false },
  ];

  return (
    <>
      <PageHero label={t("label")} title={t("title")} intro={t("intro")} />
      <section className="container-x grid gap-10 pb-24 md:pb-36 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ContactForm />
        </div>
        <Reveal as="aside" stagger className="space-y-3 lg:col-span-4">
          <h2 className="mb-4 label-mono text-fg-muted">{t("reachTitle")}</h2>
          {channels.map(({ icon: Icon, label, value, href, ltr }) => {
            const inner = (
              <>
                <span className="grid size-11 shrink-0 place-items-center bg-surface-2 text-link transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block label-mono text-fg-muted">{label}</span>
                  <span
                    className={
                      ltr ? "mt-0.5 block truncate font-medium" : "mt-0.5 block font-medium"
                    }
                    dir={ltr ? "ltr" : undefined}
                  >
                    {value}
                  </span>
                </span>
              </>
            );
            return href ? (
              <a
                key={href ?? label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4 rounded-[var(--radius-brand)] border border-border bg-surface p-4 transition-colors hover:border-primary"
              >
                {inner}
              </a>
            ) : (
              <div
                key={href ?? label}
                className="group flex items-center gap-4 rounded-[var(--radius-brand)] border border-border bg-surface p-4"
              >
                {inner}
              </div>
            );
          })}
        </Reveal>
      </section>
    </>
  );
}
