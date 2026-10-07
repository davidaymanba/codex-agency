import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import { ProjectsList } from "@/components/dashboard/projects/projects-list";
import { DashButton } from "@/components/dashboard/ui/dash-button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { hasRole, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/dashboard/mock-db";

export const metadata = { title: "Projects" };

export default async function ProjectsAdminPage({
  params,
}: PageProps<"/[locale]/dashboard/projects">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations("dash.projects");
  const items = db.projects
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: locale === "ar" ? p.title_ar : p.title_en,
      client: p.client_name,
      category: p.category,
      year: p.year,
      status: p.status,
      featured: p.featured,
      cover: p.cover_image,
      coverStyle: p.cover_style,
    }));
  return (
    <>
      <DashPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          hasRole(user, "editor") && (
            <DashButton asChild variant="primary">
              <Link href="/dashboard/projects/new">
                <Plus />
                {t("newProject")}
              </Link>
            </DashButton>
          )
        }
      />
      <ProjectsList items={items} view="grid" />
    </>
  );
}
