import { getTranslations } from "next-intl/server";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { CodeLabel } from "@/components/ui/code-label";
import type { TechLogoVM } from "@/lib/data/content";

function Item({ logo }: { logo: TechLogoVM }) {
  return (
    <span className="group inline-flex h-20 items-center gap-3 px-6 text-fg-muted transition-colors duration-300 hover:text-link md:h-24 md:px-10">
      {logo.path ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-6 fill-current transition-transform duration-300 group-hover:scale-110 md:size-7"
        >
          <path d={logo.path} />
        </svg>
      ) : (
        <span
          aria-hidden
          className="grid size-6 place-items-center border border-current font-mono text-[0.625rem] md:size-7"
        >
          {logo.name.slice(0, 2)}
        </span>
      )}
      <span className="text-title font-medium whitespace-nowrap" dir="ltr">
        {logo.name}
      </span>
    </span>
  );
}

/**
 * Two opposing marquee rows of the stack we ship with. Monochrome by default; hover lifts an
 * item to brand blue (brand colors of third parties stay out of the palette on purpose).
 */
export async function TechMarquee({ rows }: { rows: { row1: TechLogoVM[]; row2: TechLogoVM[] } }) {
  const t = await getTranslations("home");
  const all = [...rows.row1, ...rows.row2];
  return (
    <section aria-label={t("marqueeLabel")} className="border-y border-border bg-surface/40 py-8">
      <Reveal className="container-x mb-4 flex flex-wrap items-center justify-between gap-2">
        <CodeLabel>{t("marqueeLabel")}</CodeLabel>
        <p className="label-mono text-fg-muted">{t("marqueeNote")}</p>
      </Reveal>
      <ul className="sr-only">
        {all.map((l) => (
          <li key={l.name}>{l.name}</li>
        ))}
      </ul>
      <div aria-hidden>
        <Reveal className="[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          <Marquee duration={40}>
            {rows.row1.map((l) => (
              <Item key={l.name} logo={l} />
            ))}
          </Marquee>
          <Marquee duration={45} reverse>
            {rows.row2.map((l) => (
              <Item key={l.name} logo={l} />
            ))}
          </Marquee>
        </Reveal>
      </div>
    </section>
  );
}
