import type { Locale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { Cursor } from "@/components/site/cursor";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { MaintenancePage } from "@/components/site/maintenance-page";
import { PageTracker } from "@/components/site/page-tracker";
import { PageTransition } from "@/components/site/page-transition";
import { Preloader } from "@/components/site/preloader";
import { SiteSettingsProvider } from "@/components/site/site-settings";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/data/content";
import { jsonLd } from "@/lib/seo";

// Hostinger's CDN ignores on-demand revalidatePath(); a short ISR window gives it
// `s-maxage=300` instead of one year, so dashboard edits reach visitors within ~5 min.
export const revalidate = 300;

/**
 * Public-site chrome. Contact details, announcement and maintenance mode come from
 * site settings (editable in the dashboard). The dashboard has its own layout.
 */
export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const settings = await getSettings(locale as Locale);

  if (settings.maintenance && !(await getSessionUser())) {
    return <MaintenancePage email={settings.email} />;
  }
  const t = await getTranslations("maintenance");

  return (
    <SiteSettingsProvider
      value={{ email: settings.email, phones: settings.phones, whatsapps: settings.whatsapps }}
    >
      <SmoothScrollProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
            logo: `${siteConfig.url}/brand/logo.svg`,
            email: settings.email,
            telephone: settings.phones,
            areaServed: siteConfig.markets,
            sameAs: Object.values(settings.socials).filter(Boolean),
          })}
        />
        <div data-announce={settings.announcement ? "on" : "off"}>
          {settings.maintenance && (
            <p
              role="status"
              className="fixed inset-x-0 bottom-0 z-[60] bg-yellow-500 py-1.5 text-center text-xs font-medium text-navy-950"
            >
              {t("teamBanner")}
            </p>
          )}
          <PageTransition>
            <Header announcement={settings.announcement} />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            {/* Separate hydration units, so the page content becomes interactive first. */}
            <Suspense>
              <Footer />
            </Suspense>
            <Suspense>
              <WhatsAppButton />
              <Cursor />
              <Preloader />
              <PageTracker />
            </Suspense>
          </PageTransition>
        </div>
      </SmoothScrollProvider>
    </SiteSettingsProvider>
  );
}
