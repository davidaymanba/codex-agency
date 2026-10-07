import type { Locale } from "@/i18n/routing";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import {
  BlockReveal,
  BracketFrame,
  Counter,
  Magnetic,
  Marquee,
  ParallaxLayer,
  Reveal,
  RevealText,
  ScrambleText,
  TiltCard,
} from "@/components/motion";
import { Button, ButtonLink, MagneticButton } from "@/components/ui/button";
import { CodeLabel } from "@/components/ui/code-label";

export const metadata: Metadata = { title: "Playground", robots: { index: false, follow: false } };

const swatches = [
  ["bg-navy-950", "navy-950"],
  ["bg-indigo-700", "indigo-700"],
  ["bg-indigo-200", "indigo-200"],
  ["bg-indigo-50", "indigo-50"],
  ["bg-blue-600", "blue-600"],
  ["bg-blue-400", "blue-400"],
  ["bg-blue-300", "blue-300"],
  ["bg-blue-100", "blue-100"],
  ["bg-yellow-500", "yellow-500"],
  ["bg-yellow-400", "yellow-400"],
  ["bg-yellow-200", "yellow-200"],
  ["bg-yellow-50", "yellow-50"],
] as const;

/** Internal QA page for the Phase 1 design system & motion primitives (noindex). */
export default async function PlaygroundPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const ar = locale === "ar";

  return (
    <div className="container-x space-y-32 pt-[calc(var(--header-h)+4rem)] pb-32">
      <Section label="01 — Logo">
        <Logo className="w-full max-w-3xl text-primary dark:text-white" />
      </Section>

      <Section label="02 — Palette">
        <div className="grid grid-cols-2 gap-px border border-border sm:grid-cols-4 lg:grid-cols-6">
          {swatches.map(([cls, name]) => (
            <div key={name} className="bg-surface">
              <div className={`h-20 ${cls}`} />
              <p className="p-3 label-mono">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="03 — Type">
        <div className="space-y-6">
          <p className="font-display text-display-xl font-bold uppercase rtl:normal-case">
            {ar ? "نبني ونطلق" : "Build & ship"}
          </p>
          <p className="font-display text-display font-bold">
            {ar ? "عنوان عرض كبير" : "Display headline"}
          </p>
          <p className="text-headline font-medium">
            {ar ? "عنوان قسم واضح ومباشر" : "A clear section headline"}
          </p>
          <p className="text-title font-medium">{ar ? "عنوان بطاقة" : "Card title"}</p>
          <p className="max-w-2xl text-lead text-fg-muted">
            {ar
              ? "نص تمهيدي يشرح الفكرة بوضوح وبنبرة واثقة، تقني لكن إنساني."
              : "Lead paragraph that explains the idea clearly in a confident tone — technical, but human."}
          </p>
          <p className="label-mono text-fg-muted">{"{ label_mono }"}</p>
        </div>
      </Section>

      <Section label="04 — RevealText / ScrambleText">
        <div className="space-y-10">
          <RevealText as="h3" split="lines" className="max-w-4xl text-headline font-medium">
            {ar
              ? "نصمم الهوية، نكتب الكود، ونطلق حملات تنمو مع عملك — كل ذلك من فريق واحد."
              : "We design identities, write the code and launch campaigns that grow with your business — all from one team."}
          </RevealText>
          <RevealText as="p" split="words" className="max-w-3xl text-title">
            {ar ? "كشف على مستوى الكلمات للعربية." : "Word-level reveal works in both scripts."}
          </RevealText>
          <RevealText as="p" split="chars" className="text-title font-medium">
            {ar ? "طلب الحروف يتحول تلقائيًا إلى كلمات." : "Character-level reveal for Latin."}
          </RevealText>
          <p className="font-display text-display font-bold uppercase rtl:normal-case">
            <ScrambleText>{ar ? "الكود يستقر" : "Code settles"}</ScrambleText>
          </p>
        </div>
      </Section>

      <Section label="05 — BracketFrame">
        <p className="font-display text-display font-bold">
          {ar ? "لنصنع شيئًا " : "Let's build something "}
          <BracketFrame className="text-link" bracketClassName="text-fg h-[0.78em]">
            {ar ? "استثنائيًا" : "great"}
          </BracketFrame>
        </p>
        <a href="#" className="group mt-8 inline-flex text-title">
          <BracketFrame mode="hover" variant="mono">
            {ar ? "مرّر فوقي" : "Hover me"}
          </BracketFrame>
        </a>
      </Section>

      <Section label="06 — Buttons / Magnetic">
        <div className="flex flex-wrap items-center gap-4">
          <MagneticButton href="/contact" size="lg" cursor="open">
            {ar ? "ابدأ مشروعك" : "Start a project"}
          </MagneticButton>
          <ButtonLink href="/work" variant="secondary" size="lg" cursor="view">
            {ar ? "شاهد أعمالنا" : "See our work"}
          </ButtonLink>
          <Button variant="ghost">{ar ? "زر شفاف" : "Ghost button"}</Button>
          <Magnetic strength={0.5}>
            <span className="grid size-24 place-items-center rounded-full border border-border-strong label-mono">
              {"{ }"}
            </span>
          </Magnetic>
        </div>
      </Section>

      <Section label="07 — TiltCard">
        <Reveal stagger className="grid gap-6 md:grid-cols-3">
          {["E-commerce", "ERP", "AI Agents"].map((name) => (
            <TiltCard
              key={name}
              className="rounded-[var(--radius-brand)] border border-border bg-surface p-8"
            >
              <p className="label-mono text-fg-muted">{"{ solution }"}</p>
              <h3 className="mt-16 text-title font-medium">
                <BracketFrame mode="hover" variant="mono">
                  {name}
                </BracketFrame>
              </h3>
            </TiltCard>
          ))}
        </Reveal>
      </Section>

      <Section label="08 — Marquee">
        <div className="-mx-[clamp(1rem,0.5rem+2.5vw,3rem)] space-y-4">
          <Marquee trackClassName="gap-12 pe-12" duration={25}>
            {["Shopify", "Salla", "WordPress", "n8n", "Next.js", "React", "Laravel", "Flutter"].map(
              (n) => (
                <span
                  key={n}
                  className="font-display text-headline font-bold text-fg-muted uppercase transition-colors hover:text-link"
                >
                  {n}
                </span>
              ),
            )}
          </Marquee>
          <Marquee reverse trackClassName="gap-12 pe-12" duration={30}>
            {["Branding", "Development", "Marketing", "Automation", "AI Agents", "ERP", "CRM"].map(
              (n) => (
                <span key={n} className="label-mono text-lead">
                  {`{ ${n} }`}
                </span>
              ),
            )}
          </Marquee>
        </div>
      </Section>

      <Section label="09 — Counter">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            [150, "+", ar ? "مشروع منجز" : "projects delivered"],
            [90, "+", ar ? "عميل سعيد" : "happy clients"],
            [8, "", ar ? "سنوات خبرة" : "years of experience"],
            [35, "", ar ? "عضو في الفريق" : "team members"],
          ].map(([v, s, l]) => (
            <div key={String(l)}>
              <p className="font-display text-display font-bold">
                <Counter value={Number(v)} suffix={String(s)} />
              </p>
              <p className="mt-2 label-mono text-fg-muted">{`{ ${l} }`}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="10 — BlockReveal / Parallax">
        <div className="grid gap-6 md:grid-cols-2">
          <BlockReveal className="aspect-[4/3] rounded-[var(--radius-brand)]">
            <div className="grid h-full place-items-center bg-primary bg-grid text-white [--grid-line:rgb(255_255_255/0.12)]">
              <Logo title={null} className="w-1/2" />
            </div>
          </BlockReveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-brand)] border border-border bg-surface">
            <ParallaxLayer speed={0.6} className="absolute inset-x-0 top-1/3 text-center">
              <span className="font-display text-headline font-bold text-link">
                {"{ parallax }"}
              </span>
            </ParallaxLayer>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <CodeLabel className="mb-8">{label}</CodeLabel>
      {children}
    </section>
  );
}
