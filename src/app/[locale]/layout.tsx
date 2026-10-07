import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HydrationMark } from "@/components/providers/hydration-mark";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { palette } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { getDirection, routing, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { getSettings } from "@/lib/data/content";
import "../globals.css";

/**
 * `html.js` gates initial animation states; `html.preload` shows the first-visit preloader.
 * If hydration hasn't happened within 4s (JS error, blocked bundle), both classes are
 * removed so all content becomes visible.
 */
const JS_FLAG = `(function(d){var h=d.documentElement;h.classList.add('js');try{if(!/^\\/(en|ar)\\/(dashboard|login|forgot-password|reset-password|accept-invite)(\\/|$)/.test(location.pathname)&&!sessionStorage.getItem('codex-preloaded')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('preload')}catch(e){}setTimeout(function(){if(!window.__codexHydrated)h.classList.remove('js','preload')},4000)})(document);`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: palette.indigo50 },
    { media: "(prefers-color-scheme: dark)", color: palette.navy950 },
  ],
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "meta" });
  const settings = await getSettings(locale as Locale);
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: settings.seoTitle || t("title"), template: `%s — ${t("siteName")}` },
    description: settings.seoDescription || t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", ar: "/ar", "x-default": "/en" },
    },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: locale === "ar" ? "ar_AR" : "en_US",
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <ThemeProvider>
            <HydrationMark />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
