import { setRequestLocale } from "next-intl/server";
import { CMark } from "@/components/brand/logo";
import { AuthArt } from "@/components/dashboard/auth/auth-art";
import { LocaleSwitch } from "@/components/site/locale-switch";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export const metadata = { robots: { index: false, follow: false } };

/** Split screen: form on the start side, animated block grid + logo on the end side. */
export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  setRequestLocale((await params).locale as Locale);
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="CODEX" className="text-primary dark:text-white">
            <CMark title={null} className="w-8" />
          </Link>
          <div className="flex items-center gap-1">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {children}
        </main>
      </div>
      <div className="hidden lg:block">
        <AuthArt />
      </div>
    </div>
  );
}
