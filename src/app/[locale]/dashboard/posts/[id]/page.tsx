import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PostEditor } from "@/components/dashboard/posts/post-editor";
import type { Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/session";
import { postToForm } from "@/lib/dashboard/collections";
import { db } from "@/lib/dashboard/mock-db";
import { emptyDoc } from "@/lib/rich";

export const metadata = { title: "Edit post" };

export default async function PostEditPage({
  params,
}: PageProps<"/[locale]/dashboard/posts/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireUser(locale);
  if (id === "new") {
    return (
      <PostEditor
        id={null}
        initial={{
          slug: "",
          title: { en: "", ar: "" },
          excerpt: { en: "", ar: "" },
          content_en: emptyDoc(),
          content_ar: emptyDoc(),
          cover_image: "",
          cover_style: "blocks",
          tags: [],
          author_name: user.full_name,
          status: "draft",
          published_at: new Date().toISOString(),
          seo_title: { en: "", ar: "" },
          seo_description: { en: "", ar: "" },
        }}
      />
    );
  }
  const row = db.posts.find((p) => p.id === id);
  if (!row) notFound();
  return <PostEditor key={id} id={id} initial={postToForm(row)} />;
}
