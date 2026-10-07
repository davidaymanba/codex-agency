import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { ProcessSection, TeamsSection } from "@/components/sections/home/home-sections";
import { Stats } from "@/components/sections/home/stats";
import { PageHero } from "@/components/sections/pages/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Locale } from "@/i18n/routing";
import { getStats, getTeamMembers, getTeams } from "@/lib/data/content";
import { Avatar } from "@/components/dashboard/ui/primitives";
import { pageMetadata } from "@/lib/seo";

const VALUES = ["clarity", "craft", "ownership", "speed"] as const;
const MARKETS = [
  { code: "EG", en: "Egypt", ar: "مصر", city: { en: "Cairo", ar: "القاهرة" } },
  { code: "SA", en: "Saudi Arabia", ar: "السعودية", city: { en: "Riyadh", ar: "الرياض" } },
  { code: "AE", en: "UAE", ar: "الإمارات", city: { en: "Dubai", ar: "دبي" } },
  { code: "KW", en: "Kuwait", ar: "الكويت", city: { en: "Kuwait City", ar: "مدينة الكويت" } },
  { code: "OM", en: "Oman", ar: "عُمان", city: { en: "Muscat", ar: "مسقط" } },
] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return pageMetadata({ locale, path: "/about", title: t("label"), description: t("intro") });
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.about");
  const [teams, stats, members] = await Promise.all([
    getTeams(locale),
    getStats(locale),
    getTeamMembers(locale),
  ]);

  return (
    <>
      <PageHero
        label={t("label")}
        title={t("title")}
        intro={t("intro")}
        aside={
          <div className="grid aspect-[4/3] place-items-center rounded-[var(--radius-brand)] bg-primary bg-grid p-10 text-white [--grid-line:color-mix(in_oklab,var(--color-white)_15%,transparent)] [--grid-size:40px]">
            <Logo title={null} className="w-4/5" />
          </div>
        }
      />

      <section
        aria-labelledby="story-title"
        className="container-x grid gap-10 py-20 md:py-28 lg:grid-cols-12"
      >
        <div className="lg:col-span-5">
          <SectionHeading
            id="story-title"
            index="01"
            label={t("storyTitle")}
            title={t("storyTitle")}
          />
        </div>
        <Reveal stagger className="space-y-6 text-lead text-fg-muted lg:col-span-7">
          <p className="text-title text-fg">{t("story1")}</p>
          <p>{t("story2")}</p>
        </Reveal>
      </section>

      <Stats items={stats} index="02" />
      <TeamsSection teams={teams} index="03" />

      {members.length > 0 && (
        <section aria-labelledby="people-title" className="container-x pb-20 md:pb-28">
          <h2 id="people-title" className="mb-8 label-mono text-fg-muted">
            {t("peopleTitle")}
          </h2>
          <Reveal as="ul" stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {members.map((m) => (
              <li key={m.id} className="group">
                <div className="relative aspect-square overflow-hidden rounded-[var(--radius-brand)] bg-surface-2">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photo}
                      alt=""
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <Avatar name={m.name} className="size-full text-headline" />
                  )}
                </div>
                <p className="mt-3 font-medium">{m.name}</p>
                <p className="text-sm text-fg-muted">{m.role}</p>
              </li>
            ))}
          </Reveal>
        </section>
      )}

      <section aria-labelledby="values-title" className="container-x py-20 md:py-28">
        <SectionHeading
          id="values-title"
          index="04"
          label={t("valuesTitle")}
          title={t("valuesTitle")}
          className="mb-12"
        />
        <Reveal
          as="ul"
          stagger
          className="grid gap-px overflow-hidden rounded-[var(--radius-brand)] border border-border bg-border md:grid-cols-2"
        >
          {VALUES.map((v, i) => (
            <li
              key={v}
              className="group bg-surface p-8 transition-colors duration-300 hover:bg-primary hover:text-white md:p-10"
            >
              <span className="label-mono opacity-70" dir="ltr">{`{ 0${i + 1} }`}</span>
              <h3 className="mt-6 font-display text-title font-bold">{t(`values.${v}.title`)}</h3>
              <p className="mt-3 text-fg-muted transition-colors group-hover:text-blue-100">
                {t(`values.${v}.body`)}
              </p>
            </li>
          ))}
        </Reveal>
      </section>

      <ProcessSection index="05" />

      <section aria-labelledby="markets-title" className="container-x py-20 md:py-28">
        <SectionHeading
          id="markets-title"
          index="06"
          label={t("marketsTitle")}
          title={t("marketsTitle")}
          className="mb-12"
        />
        <Reveal as="ul" stagger className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {MARKETS.map((m) => (
            <li key={m.code} className="rounded-[var(--radius-brand)] border border-border p-6">
              <span className="font-display text-headline font-bold text-link" dir="ltr">
                {m.code}
              </span>
              <p className="mt-4 font-medium">{m[locale]}</p>
              <p className="text-sm text-fg-muted">{m.city[locale]}</p>
            </li>
          ))}
        </Reveal>
      </section>
    </>
  );
}
