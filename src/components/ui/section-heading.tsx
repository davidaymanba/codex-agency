import { Reveal } from "@/components/motion/reveal";
import { RevealText } from "@/components/motion/reveal-text";
import { cn } from "@/lib/utils";
import { CodeLabel } from "./code-label";

type SectionHeadingProps = {
  index: string;
  label: string;
  title: string;
  intro?: string;
  id?: string;
  className?: string;
};

/** Standard section opener: `{ 01 — Label }`, masked headline, fading intro. */
export function SectionHeading({ index, label, title, intro, id, className }: SectionHeadingProps) {
  return (
    <div className={cn("grid gap-8 md:grid-cols-12 md:items-end", className)}>
      <div className="md:col-span-8">
        <Reveal>
          <CodeLabel index={index} className="mb-6">
            {label}
          </CodeLabel>
        </Reveal>
        <RevealText as="h2" id={id} split="lines" className="font-display text-headline font-bold">
          {title}
        </RevealText>
      </div>
      {intro && (
        <Reveal delay={0.15} className="md:col-span-4">
          <p className="text-lead text-fg-muted">{intro}</p>
        </Reveal>
      )}
    </div>
  );
}
