import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { CodeLabel } from "@/components/ui/code-label";
import { cn } from "@/lib/utils";

/** Inner-page hero: code label, big masked headline, intro, optional side art. */
export function PageHero({
  label,
  index = "00",
  title,
  intro,
  aside,
  children,
  className,
}: {
  label: string;
  index?: string;
  title: string;
  intro?: string;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden pt-[calc(var(--header-h)+4rem)] pb-16 md:pt-[calc(var(--header-h)+6rem)] md:pb-24",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-grid [mask-image:linear-gradient(to_bottom,#000,transparent_85%)]"
      />
      <div
        aria-hidden
        className="absolute end-[-20%] -top-1/2 -z-10 size-[60rem] opacity-50 glow-blue"
      />
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className={aside ? "lg:col-span-7" : "lg:col-span-10"}>
          <Reveal trigger="mount">
            <CodeLabel index={index} className="mb-6">
              {label}
            </CodeLabel>
          </Reveal>
          <RevealText as="h1" trigger="mount" className="font-display text-display font-bold">
            {title}
          </RevealText>
          {intro && (
            <Reveal trigger="mount" delay={0.25}>
              <p className="mt-8 max-w-2xl text-lead text-fg-muted">{intro}</p>
            </Reveal>
          )}
          {children}
        </div>
        {aside && (
          <Reveal trigger="mount" delay={0.3} className="lg:col-span-5">
            {aside}
          </Reveal>
        )}
      </div>
    </section>
  );
}
