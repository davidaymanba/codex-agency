import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/shell/shell";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { listLeads, recentLeads } from "@/lib/dashboard/repo";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s — CODEX Dashboard" },
  robots: { index: false, follow: false },
};

/** Every dashboard route passes through here: verified session or redirect to login. */
export default async function DashboardLayout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const [recent, all] = await Promise.all([recentLeads(12), listLeads({ pageSize: 200 })]);

  return (
    <DashboardShell
      user={user}
      initialLeads={recent.map((l) => ({
        id: l.id,
        name: l.name,
        service: l.service,
        created_at: l.created_at,
      }))}
      searchLeads={all.rows.map((l) => ({ id: l.id, name: l.name, email: l.email }))}
    >
      {children}
    </DashboardShell>
  );
}
