import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/dashboard/auth/auth-forms";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">) {
  const t = await getTranslations({
    locale: (await params).locale as "en",
    namespace: "dash.auth",
  });
  return { title: t("signIn") };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  if (await getSessionUser()) redirect(`/${locale}/dashboard`);
  const next = (await searchParams).next;
  return (
    <LoginForm
      next={typeof next === "string" ? next : undefined}
      devHint={process.env.NODE_ENV !== "production"}
    />
  );
}
