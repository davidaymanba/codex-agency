import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { CodeLabel } from "@/components/ui/code-label";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";

// Code-split: the workflow canvas (SVG + GSAP timelines) is far below the fold.
const AiWorkflow = dynamic(() => import("./ai-workflow").then((m) => m.AiWorkflow));

/**
 * Signature section. Always rendered on navy (it carries the `.dark` token scope in both
 * themes) so the glowing workflow reads as the brand's "engine room".
 */
export async function AiAutomation({ heading = true }: { heading?: boolean }) {
  const t = await getTranslations("home");
  return (
    <section
      aria-labelledby={heading ? "ai-title" : undefined}
      aria-label={heading ? undefined : t("aiLabel")}
      className="dark relative isolate overflow-hidden bg-navy-950 py-24 text-white md:py-36"
    >
      <div
        aria-hidden
        className="absolute start-1/2 -top-1/3 -z-10 size-[80rem] -translate-x-1/2 opacity-50 glow-blue rtl:translate-x-1/2"
      />
      <div className="container-x">
        {heading && (
          <div className="mb-14 grid gap-8 md:mb-16 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <Reveal>
                <CodeLabel index="03" className="mb-6">
                  {t("aiLabel")}
                </CodeLabel>
              </Reveal>
              <RevealText as="h2" id="ai-title" className="font-display text-headline font-bold">
                {t("aiTitle")}
              </RevealText>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-2xl text-lead text-indigo-200">{t("aiIntro")}</p>
              </Reveal>
            </div>
            <Reveal delay={0.2} className="md:col-span-4 md:text-end">
              <p className="font-display text-display font-bold text-blue-400">
                <Counter value={60} suffix="+" />
              </p>
              <p className="mt-1 label-mono text-indigo-200">{t("aiStat")}</p>
              <Link
                href="/ai-automation"
                data-cursor="open"
                className="group mt-6 inline-flex items-center gap-2 font-medium text-white"
              >
                <span className="border-b border-white/40 pb-0.5 group-hover:border-white">
                  {t("aiCta")}
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100"
                />
              </Link>
            </Reveal>
          </div>
        )}
        <AiWorkflow />
      </div>
    </section>
  );
}
