import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ProjectCategoryVM, ProjectVM } from "@/lib/data/content";
import dynamic from "next/dynamic";

const FeaturedWork = dynamic(() => import("./featured-work").then((m) => m.FeaturedWork));

export async function WorkSection({
  projects,
  categories,
}: {
  projects: ProjectVM[];
  categories: ProjectCategoryVM[];
}) {
  const t = await getTranslations("home");
  return (
    <section aria-labelledby="work-title" className="container-x py-24 md:py-36">
      <SectionHeading
        id="work-title"
        index="05"
        label={t("workLabel")}
        title={t("workTitle")}
        intro={t("workIntro")}
        className="mb-12"
      />
      <FeaturedWork projects={projects} categories={categories} />
      <Reveal className="mt-16 flex justify-center">
        <ButtonLink href="/work" variant="secondary" size="lg" cursor="view">
          {t("workViewAll")}
        </ButtonLink>
      </Reveal>
    </section>
  );
}
