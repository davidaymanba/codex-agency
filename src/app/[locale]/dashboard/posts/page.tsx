import { Plus } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { DashPageHeader } from "@/components/dashboard/content/page-header";
import { DashButton } from "@/components/dashboard/ui/dash-button";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { Card } from "@/components/dashboard/ui/primitives";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { hasRole, requireUser } from "@/lib/auth/session";
import { allPosts } from "@/lib/dashboard/repo";
import { cn } from "@/lib/utils";

export const metadata = { title: "Posts" };

export default async function PostsAdminPage({ params }: PageProps<"/[locale]/dashboard/posts">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const [t, format] = await Promise.all([getTranslations("dash"), getFormatter()]);
  const now = new Date();
  const posts = await allPosts();
  const state = (p: (typeof posts)[number]) =>
    p.status === "draft" ? "draft" : new Date(p.published_at) > now ? "scheduled" : "published";

  return (
    <>
      <DashPageHeader
        title={t("posts.title")}
        subtitle={t("posts.subtitle")}
        actions={
          hasRole(user, "editor") && (
            <DashButton asChild variant="primary">
              <Link href="/dashboard/posts/new">
                <Plus />
                {t("posts.newPost")}
              </Link>
            </DashButton>
          )
        }
      />
      {posts.length === 0 ? (
        <Card>
          <EmptyState title={t("content.empty")} body={t("content.emptyBody")} />
        </Card>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs text-fg-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("fields.title")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("fields.status")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("fields.published_at")}</th>
                <th className="hidden px-4 py-3 text-start font-medium md:table-cell">
                  {t("fields.tags")}
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const s = state(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-2"
                  >
                    <td className="max-w-md px-4 py-3">
                      <Link
                        href={`/dashboard/posts/${p.id}`}
                        className="block truncate font-medium hover:text-link"
                        dir="auto"
                      >
                        {locale === "ar" ? p.title_ar : p.title_en}
                      </Link>
                      <span className="text-xs text-fg-muted">
                        {p.author_name} · {t("posts.minutes", { n: p.reading_minutes })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 label-mono",
                          s === "published"
                            ? "bg-blue-600 text-white"
                            : s === "scheduled"
                              ? "bg-yellow-200 text-navy-950"
                              : "bg-surface-2 text-fg-muted",
                        )}
                      >
                        {t(`posts.${s}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-fg-muted">
                      {format.dateTime(new Date(p.published_at), {
                        dateStyle: "medium",
                        timeStyle: "short",
                        numberingSystem: "latn",
                      })}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="flex flex-wrap gap-1">
                        {p.tags.map((tag) => (
                          <span key={tag} className="bg-surface-2 px-1.5 py-0.5 text-xs">
                            {tag}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
