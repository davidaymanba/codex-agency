import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui/section-heading";
import type { TeamVM, TestimonialVM } from "@/lib/data/content";
import { Process } from "./process";
import { Teams } from "./teams";
import dynamic from "next/dynamic";

const Testimonials = dynamic(() => import("./testimonials").then((m) => m.Testimonials));

export async function TeamsSection({ teams, index = "06" }: { teams: TeamVM[]; index?: string }) {
  const t = await getTranslations("home");
  return (
    <section aria-labelledby="teams-title" className="container-x py-24 md:py-36">
      <SectionHeading
        id="teams-title"
        index={index}
        label={t("teamsLabel")}
        title={t("teamsTitle")}
        intro={t("teamsIntro")}
        className="mb-12 md:mb-16"
      />
      <Teams teams={teams} />
    </section>
  );
}

export async function ProcessSection({ index = "07" }: { index?: string }) {
  const t = await getTranslations("home");
  return (
    <section
      aria-labelledby="process-title"
      className="border-y border-border bg-surface/50 py-24 md:py-36"
    >
      <div className="container-x">
        <SectionHeading
          id="process-title"
          index={index}
          label={t("processLabel")}
          title={t("processTitle")}
          className="mb-14 md:mb-20"
        />
        <Process />
      </div>
    </section>
  );
}

export async function TestimonialsSection({
  items,
  index = "08",
}: {
  items: TestimonialVM[];
  index?: string;
}) {
  const t = await getTranslations("home");
  return (
    <section aria-labelledby="testimonials-title" className="overflow-hidden py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="testimonials-title"
          index={index}
          label={t("testimonialsLabel")}
          title={t("testimonialsTitle")}
          className="mb-12 md:mb-16"
        />
        <Testimonials items={items} />
      </div>
    </section>
  );
}
