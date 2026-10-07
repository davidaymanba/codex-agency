import { getTranslations } from "next-intl/server";
import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import type { StatVM } from "@/lib/data/content";

/** Count-up stats. Numbers in the display face, labels in bracket style. */
export async function Stats({ items, index = "04" }: { items: StatVM[]; index?: string }) {
  const t = await getTranslations("home");
  return (
    <section aria-labelledby="stats-title" className="container-x py-24 md:py-36">
      <SectionHeading
        id="stats-title"
        index={index}
        label={t("statsLabel")}
        title={t("statsTitle")}
        className="mb-12 md:mb-16"
      />
      <Reveal
        as="dl"
        stagger
        className="grid grid-cols-2 border-s border-t border-border lg:grid-cols-4"
      >
        {items.map((s) => (
          <div
            key={s.key}
            className="group relative flex flex-col-reverse justify-between gap-10 border-e border-b border-border p-5 md:min-h-[16rem] md:p-8"
          >
            <dt className="label-mono text-fg-muted">
              {/* LTR run so the braces never flip; <bdi> keeps Arabic labels intact. */}
              <span dir="ltr">
                <span aria-hidden>{"{ "}</span>
                <bdi>{s.label}</bdi>
                <span aria-hidden>{" }"}</span>
              </span>
            </dt>
            <dd className="font-display text-display font-bold transition-colors duration-300 group-hover:text-link">
              <Counter value={s.value} suffix={s.suffix} />
            </dd>
            <span
              aria-hidden
              className="absolute end-0 top-0 size-3 bg-primary opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        ))}
      </Reveal>
    </section>
  );
}
