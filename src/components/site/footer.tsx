import { ArrowUpRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import {
  BehanceIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/brand/social-icons";
import { BlockReveal } from "@/components/motion/block-reveal";
import { BracketFrame } from "@/components/motion/bracket-frame";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { ButtonLink, MagneticButton } from "@/components/ui/button";
import { CodeLabel } from "@/components/ui/code-label";
import { mainNav, whatsappHref } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { getSettings } from "@/lib/data/content";
import { Link } from "@/i18n/navigation";
import { BackToTop } from "./back-to-top";

const socials = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedinIcon },
  { key: "behance", label: "Behance", Icon: BehanceIcon },
  { key: "x", label: "X", Icon: XIcon },
  { key: "tiktok", label: "TikTok", Icon: TiktokIcon },
] as const;

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const year = new Date().getFullYear();
  const settings = await getSettings((await getLocale()) as Locale);

  return (
    <footer className="relative overflow-hidden border-t border-border bg-bg">
      {/* Big CTA */}
      <section aria-labelledby="footer-cta" className="relative container-x py-24 md:py-36">
        <div
          aria-hidden
          className="pointer-events-none absolute start-1/2 -top-40 size-[60rem] -translate-x-1/2 opacity-60 glow-blue rtl:translate-x-1/2"
        />
        <CodeLabel className="mb-8">{"let's_talk"}</CodeLabel>
        <h2 id="footer-cta" className="relative max-w-5xl font-display text-display font-bold">
          <RevealText as="span" split="words" className="block">
            {t("ctaLead")}
          </RevealText>
          <span className="inline-flex items-baseline">
            <BracketFrame className="text-link" bracketClassName="h-[0.78em] text-fg">
              {t("ctaWord")}
            </BracketFrame>
            <span>{t("ctaTail")}</span>
          </span>
        </h2>
        <Reveal className="relative mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-lead text-fg-muted">{t("ctaBody")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton href="/contact" size="lg" cursor="open">
              {t("ctaButton")}
            </MagneticButton>
            <ButtonLink
              href={whatsappHref(settings.whatsapp)}
              variant="secondary"
              size="lg"
              icon={<WhatsAppIcon className="size-5" />}
            >
              {t("whatsapp")}
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      {/* Link grid */}
      <div className="container-x">
        <Reveal
          stagger
          className="grid gap-10 border-t border-border py-14 sm:grid-cols-2 lg:grid-cols-12"
        >
          <div className="lg:col-span-4">
            <Logo title={null} className="w-32 text-primary dark:text-white" />
            <p className="mt-5 max-w-xs text-fg-muted">{t("tagline")}</p>
            <p className="mt-6 label-mono text-fg-muted">{t("markets")}</p>
          </div>

          <FooterCol title={t("explore")} className="lg:col-span-2">
            {mainNav.slice(0, 4).map((item) => (
              <FooterLink key={item.key} href={item.href}>
                {tn(item.key)}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title={t("company")} className="lg:col-span-2">
            <FooterLink href="/about">{tn("about")}</FooterLink>
            <FooterLink href="/blog">{tn("blog")}</FooterLink>
            <FooterLink href="/contact">{tn("contact")}</FooterLink>
          </FooterCol>

          <FooterCol title={t("reach")} className="lg:col-span-2">
            <li>
              <a href={`mailto:${settings.email}`} className="hover:text-link">
                {settings.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                dir="ltr"
                className="hover:text-link"
              >
                {settings.phone}
              </a>
            </li>
            <li>
              <a
                href={whatsappHref(settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-link"
              >
                WhatsApp
              </a>
            </li>
          </FooterCol>

          <FooterCol title={t("follow")} className="lg:col-span-2">
            <li className="flex flex-wrap gap-2">
              {socials
                .filter(({ key }) => settings.socials[key])
                .map(({ key, label, Icon }) => (
                  <a
                    key={key}
                    href={settings.socials[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid size-10 place-items-center border border-border text-fg transition-colors duration-200 hover:border-primary hover:bg-primary hover:text-white"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
            </li>
          </FooterCol>
        </Reveal>
      </div>

      {/* Giant wordmark */}
      <div className="container-x" aria-hidden>
        <BlockReveal cols={14} rows={3} order="start" className="py-2">
          <Logo title={null} className="w-full text-primary/90 dark:text-surface-2" />
        </BlockReveal>
      </div>

      <div className="container-x flex flex-col-reverse items-start justify-between gap-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-center">
        <p>
          © <span dir="ltr">{year}</span> CODEX. {t("rights")}
        </p>
        <BackToTop label={t("backToTop")} />
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-5 label-mono text-fg-muted">{title}</h3>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 transition-colors hover:text-link"
      >
        {children}
        <ArrowUpRight
          aria-hidden
          className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,translate] duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:translate-x-1 rtl:-scale-x-100"
        />
      </Link>
    </li>
  );
}
