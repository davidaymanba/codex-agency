import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProjectEditor } from "@/components/dashboard/projects/project-editor";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { projectToForm } from "@/lib/dashboard/collections";
import { projectById } from "@/lib/dashboard/repo";

export const metadata = { title: "Edit project" };

const EMPTY = {
  slug: "",
  title: { en: "", ar: "" },
  summary: { en: "", ar: "" },
  challenge: { en: "", ar: "" },
  approach: { en: "", ar: "" },
  content_en: null,
  content_ar: null,
  category: "development",
  tags: [],
  client_name: "",
  year: new Date().getFullYear(),
  cover_image: "",
  cover_style: "blocks",
  gallery: [],
  live_url: "",
  results: [],
  services: [],
  featured: false,
  status: "draft",
  seo_title: { en: "", ar: "" },
  seo_description: { en: "", ar: "" },
};

export default async function ProjectEditPage({
  params,
}: PageProps<"/[locale]/dashboard/projects/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  await requireUser(locale);
  if (id === "new") return <ProjectEditor id={null} initial={EMPTY} />;
  const row = await projectById(id);
  if (!row) notFound();
  return <ProjectEditor key={id} id={id} initial={projectToForm(row)} />;
}
