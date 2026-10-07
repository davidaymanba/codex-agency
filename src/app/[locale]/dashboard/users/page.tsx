import { getTranslations, setRequestLocale } from "next-intl/server";
import { UsersTable } from "@/components/dashboard/admin/users-table";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { listAllProfiles } from "@/lib/dashboard/repo";

export const metadata = { title: "Users & roles" };

export default async function UsersPage({ params }: PageProps<"/[locale]/dashboard/users">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await requireUser(locale, "admin");
  const t = await getTranslations("dash.users");
  const users = (await listAllProfiles()).map(
    ({ id, email, full_name, role, active, invited_at, last_sign_in_at }) => ({
      id,
      email,
      full_name,
      role,
      active,
      invited_at,
      last_sign_in_at,
    }),
  );
  return (
    <>
      <DashPageHeader title={t("title")} subtitle={t("subtitle")} />
      <UsersTable users={users} />
    </>
  );
}
