import { setRequestLocale } from "next-intl/server";
import { AiAutomation } from "@/components/sections/home/ai-automation";
import { Hero } from "@/components/sections/home/hero";
import {
  ProcessSection,
  TeamsSection,
  TestimonialsSection,
} from "@/components/sections/home/home-sections";
import { Services } from "@/components/sections/home/services";
import { Solutions } from "@/components/sections/home/solutions";
import { Stats } from "@/components/sections/home/stats";
import { TechMarquee } from "@/components/sections/home/tech-marquee";
import { WorkSection } from "@/components/sections/home/work-section";
import type { Locale } from "@/i18n/routing";
import {
  getFeaturedProjects,
  getProjectCategories,
  getServices,
  getSolutions,
  getStats,
  getTeams,
  getTechLogos,
  getTestimonials,
} from "@/lib/data/content";

/** Home. The final CTA ("Let's build something { great }.") lives in the global footer. */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [services, solutions, logos, stats, projects, categories, teams, testimonials] =
    await Promise.all([
      getServices(locale),
      getSolutions(locale),
      getTechLogos(),
      getStats(locale),
      getFeaturedProjects(locale),
      getProjectCategories(locale),
      getTeams(locale),
      getTestimonials(locale),
    ]);

  return (
    <>
      <Hero />
      <TechMarquee rows={logos} />
      <Services items={services} />
      <Solutions items={solutions} />
      <AiAutomation />
      <Stats items={stats} />
      <WorkSection projects={projects} categories={categories} />
      <TeamsSection teams={teams} />
      <ProcessSection />
      <TestimonialsSection items={testimonials} />
    </>
  );
}
